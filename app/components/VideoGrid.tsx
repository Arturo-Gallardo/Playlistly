import type { PlaylistVideo } from "../types/playlist";
import { VideoCard } from "./VideoCard";

const TILE_WIDTH_REM = 8;

type VideoGridProps = {
  onVideoHover: (video: PlaylistVideo) => void;
  onVideoHoverEnd: () => void;
  videos: PlaylistVideo[];
};

export function VideoGrid({
  onVideoHover,
  onVideoHoverEnd,
  videos,
}: VideoGridProps) {
  const columnCount = getBalancedColumnCount(videos.length);

  return (
    <section className="w-max">
      <div
        className="grid gap-2"
        style={{
          // the column count changes with playlist size, so this has to stay dynamic
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, ${TILE_WIDTH_REM}rem))`,
        }}
      >
        {videos.map((video, index) => (
          <VideoCard
            index={index}
            key={video.id}
            onHover={onVideoHover}
            onHoverEnd={onVideoHoverEnd}
            video={video}
          />
        ))}
      </div>
    </section>
  );
}

function getBalancedColumnCount(videoCount: number) {
  // balance the number of tiles per side so playlists do not stack vertically
  return Math.max(1, Math.ceil(Math.sqrt(videoCount)));
}
