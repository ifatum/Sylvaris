import QtQuick
import QtMultimedia

Item {
    id: root

    property url source
    property bool autoplay: true
    property bool loop: true
    property bool muted: false
    readonly property bool playing: player.playbackState === MediaPlayer.PlayingState
    readonly property real position: player.position / 1000
    readonly property real duration: player.duration / 1000
    readonly property bool ready: player.mediaStatus === MediaPlayer.LoadedMedia || player.mediaStatus === MediaPlayer.BufferedMedia || player.mediaStatus === MediaPlayer.EndOfMedia
    readonly property string error: player.error === MediaPlayer.NoError ? "" : player.errorString || "This video cannot be played"

    function toggle(): void {
        if (root.playing)
            player.pause();
        else
            player.play();
    }

    function seek(fraction: real): void {
        if (player.duration > 0)
            player.position = Math.max(0, Math.min(1, fraction)) * player.duration;
    }

    function stop(): void {
        player.stop();
    }

    MediaPlayer {
        id: player
        source: root.source
        videoOutput: output
        loops: root.loop ? MediaPlayer.Infinite : 1
        audioOutput: AudioOutput {
            muted: root.muted
        }
        onSourceChanged: {
            if (root.autoplay)
                player.play();
        }
        Component.onCompleted: {
            if (root.autoplay)
                player.play();
        }
    }

    VideoOutput {
        id: output
        anchors.fill: parent
        fillMode: VideoOutput.PreserveAspectFit
    }
}
