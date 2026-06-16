import { withBasePath } from '../utils/paths';

export default function SideVideo() {
    return (
        <div className="dashboard-video">
            <div className="video-card">
                <video
                    src={withBasePath('/videos/abqora-intro.mp4')}
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            </div>
        </div>
    );
}
