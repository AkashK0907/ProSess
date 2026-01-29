import { Music2, Play, Volume2, Check, X, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useMusic } from "@/context/MusicContext";

export default function MusicPage() {
  const { tracks, toggleTrackEnabled, currentTrack, isPlaying, previewTrack, stop } = useMusic();

  const categories = {
    nature: "Nature Sounds",
    noise: "Focus Noise",
    lofi: "Lo-Fi Beats"
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <section className="animate-fade-up">
          <h2 className="section-title">Focus Playlist</h2>
          <p className="text-muted-foreground mb-6">
            Select the sounds you want to be included in your focus sessions. 
            Enabled tracks will be rotated automatically.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`
                  surface-card p-4 flex items-center justify-between transition-all duration-300
                  ${track.enabled ? 'border-primary/20 bg-primary/5' : 'opacity-70 grayscale-[0.5]'}
                  ${currentTrack?.id === track.id && isPlaying ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                `}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => previewTrack(track.id)}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${currentTrack?.id === track.id && isPlaying 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary hover:bg-secondary/80'}
                    `}
                    title="Preview Sound"
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                       <div className="flex gap-0.5 items-end h-3">
                         <div className="w-0.5 h-3 bg-current animate-[pulse_0.6s_ease-in-out_infinite]" />
                         <div className="w-0.5 h-2 bg-current animate-[pulse_0.8s_ease-in-out_infinite]" />
                         <div className="w-0.5 h-3 bg-current animate-[pulse_1s_ease-in-out_infinite]" />
                       </div>
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                  
                  <div>
                    <h3 className="font-medium">{track.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {track.category}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleTrackEnabled(track.id)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors
                    ${track.enabled 
                      ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                  `}
                >
                  {track.enabled ? (
                    <>
                      <Check className="w-3 h-3" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3" />
                      Disabled
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="animate-fade-up stagger-2">
           <div className="surface-card p-6 flex items-start gap-4 bg-blue-500/5 border-blue-500/10">
             <ShieldCheck className="w-6 h-6 text-blue-500 mt-1" />
             <div>
               <h3 className="font-medium mb-1">How it works</h3>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 These sounds will only play when you start a <strong>Session</strong>.
                 <br className="mb-2"/>
                 • <strong>Pomodoro:</strong> The sound changes after every break.
                 <br/>
                 • <strong>Free Focus:</strong> The sound changes automatically every 30 minutes.
               </p>
             </div>
           </div>
        </section>
      </div>
    </AppLayout>
  );
}
