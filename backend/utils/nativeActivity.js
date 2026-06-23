const ALLOWED_COMMANDS = new Set(['move_forward', 'turn_left', 'turn_right']);
const DIRECTIONS = ['north', 'east', 'south', 'west'];
const DELTAS = {
    north: { row: -1, column: 0 },
    east: { row: 0, column: 1 },
    south: { row: 1, column: 0 },
    west: { row: 0, column: -1 },
};

const cellKey = ({ row, column }) => `${row}:${column}`;

const validateSequenceMaze = (config, commands) => {
    const maxBlocks = Number(config?.maxBlocks) || 30;
    if (!Array.isArray(commands) || commands.length === 0 || commands.length > maxBlocks) {
        return { valid: false, message: `استخدم من 1 إلى ${maxBlocks} أمرًا لحل المتاهة` };
    }
    if (commands.some((command) => typeof command !== 'string' || !ALLOWED_COMMANDS.has(command))) {
        return { valid: false, message: 'يحتوي الحل على أمر غير مسموح' };
    }

    const rows = Number(config?.rows);
    const columns = Number(config?.columns);
    const start = config?.start;
    const goal = config?.goal;
    const validCells = new Set((config?.validCells || []).map(cellKey));
    if (!Number.isInteger(rows) || !Number.isInteger(columns) || !start || !goal || !validCells.size) {
        return { valid: false, message: 'إعداد النشاط غير مكتمل' };
    }

    const state = {
        row: Number(start.row),
        column: Number(start.column),
        direction: start.direction,
    };
    if (!DIRECTIONS.includes(state.direction) || !validCells.has(cellKey(state))) {
        return { valid: false, message: 'نقطة بداية النشاط غير صالحة' };
    }

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
            const insideGrid = state.row >= 0 && state.row < rows
                && state.column >= 0 && state.column < columns;
            if (!insideGrid || !validCells.has(cellKey(state))) {
                return {
                    valid: false,
                    message: `خرج الروبوت عن المسار عند الأمر رقم ${index + 1}`,
                    trace,
                };
            }
        }
        trace.push({ ...state });
    }

    const reachedGoal = state.row === Number(goal.row) && state.column === Number(goal.column);
    if (!reachedGoal) {
        return { valid: false, message: 'لم يصل الروبوت إلى النجمة بعد', trace };
    }

    return { valid: true, trace };
};

const validateNativeActivity = (nativeActivity, commands) => {
    if (!nativeActivity?.enabled || nativeActivity.kind !== 'sequence_maze') {
        return { valid: false, message: 'هذا الدرس لا يحتوي على نشاط تفاعلي مدعوم' };
    }
    return validateSequenceMaze(nativeActivity.config, commands);
};

module.exports = { validateNativeActivity, validateSequenceMaze };
