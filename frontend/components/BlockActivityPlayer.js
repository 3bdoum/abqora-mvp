import { useEffect, useMemo, useRef, useState } from 'react';
import API from '../utils/api';

const COMMAND_BY_BLOCK = {
    abq_move_forward: 'move_forward',
    abq_turn_left: 'turn_left',
    abq_turn_right: 'turn_right',
};

const DIRECTIONS = ['north', 'east', 'south', 'west'];
const DIRECTION_ICONS = { north: '↑', east: '→', south: '↓', west: '←' };
const DELTAS = {
    north: { row: -1, column: 0 },
    east: { row: 0, column: 1 },
    south: { row: 1, column: 0 },
    west: { row: 0, column: -1 },
};

const keyOf = ({ row, column }) => `${row}:${column}`;
const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

const simulate = (config, commands) => {
    const validCells = new Set((config.validCells || []).map(keyOf));
    const state = { ...config.start };
    const trace = [{ ...state }];

    for (let index = 0; index < commands.length; index += 1) {
        const command = commands[index];
        const directionIndex = DIRECTIONS.indexOf(state.direction);
        if (command === 'turn_left') {
            state.direction = DIRECTIONS[(directionIndex + 3) % DIRECTIONS.length];
        } else if (command === 'turn_right') {
            state.direction = DIRECTIONS[(directionIndex + 1) % DIRECTIONS.length];
        } else {
            const delta = DELTAS[state.direction];
            state.row += delta.row;
            state.column += delta.column;
            if (!validCells.has(keyOf(state))) {
                return {
                    success: false,
                    trace,
                    message: `خرج الروبوت عن المسار عند الأمر رقم ${index + 1}. جرّب ترتيبًا آخر.`,
                };
            }
        }
        trace.push({ ...state });
    }

    const success = state.row === config.goal.row && state.column === config.goal.column;
    return {
        success,
        trace,
        message: success ? 'أحسنت! وصل الروبوت إلى النجمة.' : 'لم يصل الروبوت إلى النجمة بعد.',
    };
};

export default function BlockActivityPlayer({ lessonId, activity, lessonState, onSubmitted }) {
    const workspaceHost = useRef(null);
    const workspaceRef = useRef(null);
    const [robot, setRobot] = useState(activity.config.start);
    const [message, setMessage] = useState('اسحب الأوامر، صِلها ببعضها، ثم شغّل الحل.');
    const [messageType, setMessageType] = useState('info');
    const [running, setRunning] = useState(false);
    const config = activity.config;
    const isReadOnly = ['awaiting_approval', 'completed'].includes(lessonState);

    const cells = useMemo(() => {
        const result = [];
        for (let row = 0; row < config.rows; row += 1) {
            for (let column = 0; column < config.columns; column += 1) {
                result.push({ row, column });
            }
        }
        return result;
    }, [config.columns, config.rows]);

    const validCellKeys = useMemo(
        () => new Set((config.validCells || []).map(keyOf)),
        [config.validCells]
    );

    useEffect(() => {
        let disposed = false;
        let resizeObserver;

        const createWorkspace = async () => {
            const Blockly = await import('blockly');
            if (disposed || !workspaceHost.current) return;

            if (!Blockly.Blocks.abq_move_forward) {
                Blockly.defineBlocksWithJsonArray([
                    {
                        type: 'abq_move_forward',
                        message0: 'تقدّم خطوة 🤖',
                        previousStatement: null,
                        nextStatement: null,
                        colour: 205,
                        tooltip: 'حرّك الروبوت خانة واحدة إلى الأمام',
                    },
                    {
                        type: 'abq_turn_left',
                        message0: 'استدر يسارًا ↶',
                        previousStatement: null,
                        nextStatement: null,
                        colour: 275,
                        tooltip: 'غيّر اتجاه الروبوت إلى اليسار',
                    },
                    {
                        type: 'abq_turn_right',
                        message0: 'استدر يمينًا ↷',
                        previousStatement: null,
                        nextStatement: null,
                        colour: 275,
                        tooltip: 'غيّر اتجاه الروبوت إلى اليمين',
                    },
                ]);
            }

            const workspace = Blockly.inject(workspaceHost.current, {
                toolbox: {
                    kind: 'flyoutToolbox',
                    contents: [
                        { kind: 'block', type: 'abq_move_forward' },
                        { kind: 'block', type: 'abq_turn_left' },
                        { kind: 'block', type: 'abq_turn_right' },
                    ],
                },
                rtl: true,
                trashcan: true,
                zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 1.2, minScale: 0.55 },
                move: { scrollbars: true, drag: true, wheel: true },
                readOnly: isReadOnly,
            });
            workspaceRef.current = workspace;

            if (!isReadOnly) {
                const starter = workspace.newBlock('abq_move_forward');
                starter.initSvg();
                starter.render();
                starter.moveBy(170, 55);
            }

            resizeObserver = new ResizeObserver(() => Blockly.svgResize(workspace));
            resizeObserver.observe(workspaceHost.current);
        };

        createWorkspace();
        return () => {
            disposed = true;
            resizeObserver?.disconnect();
            workspaceRef.current?.dispose();
            workspaceRef.current = null;
        };
    }, [isReadOnly]);

    const readCommands = () => {
        const workspace = workspaceRef.current;
        if (!workspace) return { error: 'مساحة البرمجة لم تجهز بعد.' };

        const allBlocks = workspace.getAllBlocks(false);
        const topBlocks = workspace.getTopBlocks(true);
        if (!allBlocks.length) return { error: 'أضف أمرًا واحدًا على الأقل.' };
        if (topBlocks.length !== 1) return { error: 'صِل جميع الأوامر في سلسلة واحدة.' };
        if (allBlocks.length > config.maxBlocks) {
            return { error: `الحل طويل جدًا. استخدم ${config.maxBlocks} أمرًا كحد أقصى.` };
        }

        const commands = [];
        let block = topBlocks[0];
        while (block) {
            const command = COMMAND_BY_BLOCK[block.type];
            if (!command) return { error: 'يوجد أمر غير مدعوم في مساحة البرمجة.' };
            commands.push(command);
            block = block.getNextBlock();
        }
        if (commands.length !== allBlocks.length) return { error: 'صِل جميع الأوامر في سلسلة واحدة.' };
        return { commands };
    };

    const runProgram = async () => {
        if (running || isReadOnly) return;
        const program = readCommands();
        if (program.error) {
            setMessage(program.error);
            setMessageType('error');
            return;
        }

        setRunning(true);
        setMessage('الروبوت ينفّذ الأوامر الآن…');
        setMessageType('info');
        setRobot(config.start);
        const result = simulate(config, program.commands);
        for (const step of result.trace.slice(1)) {
            await sleep(320);
            setRobot(step);
        }

        if (!result.success) {
            setMessage(result.message);
            setMessageType('error');
            setRunning(false);
            return;
        }

        setMessage('نجح الحل محليًا. يجري التحقق منه بأمان…');
        setMessageType('success');
        try {
            const { data } = await API.post('/progress/native-activity', {
                lessonId,
                commands: program.commands,
            });
            setMessage(
                data.studentState === 'completed'
                    ? 'تم إكمال الدرس بنجاح!'
                    : 'تم التحقق من الحل وإرساله. بانتظار موافقة المعلم.'
            );
            setMessageType('success');
            onSubmitted?.(data.studentState);
        } catch (error) {
            setMessage(error.response?.data?.message || 'تعذر التحقق من الحل. حاول مرة أخرى.');
            setMessageType('error');
        } finally {
            setRunning(false);
        }
    };

    const resetActivity = () => {
        setRobot(config.start);
        setMessage('أعد ترتيب الأوامر ثم شغّل الحل.');
        setMessageType('info');
    };

    const clearWorkspace = () => {
        workspaceRef.current?.clear();
        resetActivity();
    };

    return (
        <section className="native-activity-card" aria-labelledby="native-activity-title">
            <div className="native-activity-heading">
                <div>
                    <span className="eyebrow">مختبر عبقورة</span>
                    <h2 id="native-activity-title">برمج الروبوت ليصل إلى النجمة</h2>
                    <p>الحد الأقصى: {config.maxBlocks} أمرًا. لا تحتاج إلى مغادرة عبقورة.</p>
                </div>
                <span className="native-badge">نشاط داخل الموقع</span>
            </div>

            <div className="native-activity-layout">
                <div className="maze-panel">
                    <div
                        className="maze-grid"
                        style={{ '--activity-columns': config.columns }}
                        role="img"
                        aria-label="متاهة روبوت عبقورة"
                    >
                        {cells.map((cell) => {
                            const isPath = validCellKeys.has(keyOf(cell));
                            const isGoal = cell.row === config.goal.row && cell.column === config.goal.column;
                            const hasRobot = cell.row === robot.row && cell.column === robot.column;
                            return (
                                <div
                                    key={keyOf(cell)}
                                    className={`maze-cell ${isPath ? 'path' : 'wall'} ${isGoal ? 'goal' : ''}`}
                                >
                                    {isGoal && <span className="goal-star" aria-hidden="true">★</span>}
                                    {hasRobot && (
                                        <span className="maze-robot" aria-label={`اتجاه الروبوت ${robot.direction}`}>
                                            <span aria-hidden="true">🤖</span>
                                            <b aria-hidden="true">{DIRECTION_ICONS[robot.direction]}</b>
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className={`activity-message ${messageType}`} role="status" aria-live="polite">
                        {message}
                    </div>
                </div>

                <div className="blockly-panel">
                    <div ref={workspaceHost} className="blockly-workspace" aria-label="مساحة أوامر البرمجة" />
                    {!isReadOnly && (
                        <div className="activity-actions">
                            <button type="button" className="button" onClick={runProgram} disabled={running}>
                                {running ? 'جاري التشغيل…' : '▶ شغّل الحل'}
                            </button>
                            <button type="button" className="button secondary" onClick={resetActivity} disabled={running}>
                                إعادة المحاولة
                            </button>
                            <button type="button" className="text-button danger-text" onClick={clearWorkspace} disabled={running}>
                                مسح الأوامر
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
