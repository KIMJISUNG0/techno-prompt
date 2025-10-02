import React, { useEffect, useRef } from 'react';

// Lightweight frequency bar viz (post-compressor) using engine getAnalyser()
// Design goals:
// - Zero allocations per frame (reuse arrays provided by engine)
// - 30fps throttled via requestAnimationFrame + time check
// - Only first N bars (e.g., 48) for subtle backdrop
// - Fades with radial mask + blend-mode for non-intrusive effect

interface AnalyserPayload {
  freq: Uint8Array;
  time: Uint8Array;
  level: number;
}

export default function AudioViz({ className="", bars=48, showWave=true }: { className?:string; bars?:number; showWave?:boolean }) {
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const lastRef = useRef<number>(0);
  const peaksRef = useRef<number[]>([]);
  const hitFlashRef = useRef<number>(0); // 0..1

  useEffect(()=> {
    let mounted = true;
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext('2d', { alpha:true }); if(!ctx) return;

    function resize(){
      if(!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(1,0,0,1,0,0);
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    function frame(ts:number){
      if(!mounted) return;
      if (ts - lastRef.current < 33) { // ~30fps
        requestAnimationFrame(frame); return;
      }
      lastRef.current = ts;
  // legacy: retained for potential future API caching; currently unused
  const _api:any = (window as any).liveAPICache || ((window as any).liveAPI = (window as any).liveAPI || null);
      let payload: AnalyserPayload | null = null;
      try {
        // attempt cached access route: runLiveCode builds getLiveAPI each time; we expose via side-channel if needed.
        if ((window as any).lastLiveAPI) {
          payload = (window as any).lastLiveAPI.getAnalyser?.();
        } else if ((window as any).getLiveAPI) {
          payload = (window as any).getLiveAPI().getAnalyser?.();
        }
  } catch {/* ignore analyser access errors */}
      if (payload && canvas && ctx) {
        const data = payload.freq;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        const W = canvas.clientWidth; const H = canvas.clientHeight;
        const step = Math.floor(data.length / bars) || 1;
        const barW = W / bars;
        // Peak decay
        if (peaksRef.current.length !== bars) peaksRef.current = new Array(bars).fill(0);
        for (let p=0;p<bars;p++) peaksRef.current[p] *= 0.92;
        for (let i=0;i<bars;i++){
          const v = data[i*step] / 255; // 0..1
          // update peak
          if (v > peaksRef.current[i]) peaksRef.current[i] = v;
          const peak = peaksRef.current[i];
          const h = v * H * 0.75;
          const x = i * barW;
          // adaptive hue based on index energy weighting
          const hue = 180 + (i/bars)*140; // teal -> magenta
          const grad = ctx.createLinearGradient(x, H-h, x, H);
          grad.addColorStop(0, `hsla(${hue},85%,65%,0.70)`);
          grad.addColorStop(1, `hsla(${hue+40},90%,45%,0.05)`);
          ctx.fillStyle = grad;
          const radius = Math.min(6, barW*0.35);
          const y = H - h;
          roundRect(ctx, x+barW*0.15, y, barW*0.7, h, radius);
          // draw peak marker
          const peakY = H - peak * H * 0.75;
          ctx.fillStyle = `hsla(${hue},90%,80%,0.45)`;
          ctx.fillRect(x+barW*0.32, peakY-2, barW*0.36, 2);
        }
        // waveform overlay (centered)
        if (showWave) {
          const wave = payload.time;
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineWidth = 1.4;
            ctx.strokeStyle = 'rgba(255,255,255,0.16)';
            ctx.beginPath();
            const mid = H*0.55;
            for (let i=0;i<wave.length;i++) {
              const t = i / (wave.length-1);
              const x = t * W;
              const v = (wave[i]-128)/128; // -1..1
              const y = mid + v * H*0.22;
              if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            }
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        }
        // overlay soft mask
        const g = ctx.createRadialGradient(W*0.5, H*0.65, H*0.2, W*0.5, H*0.65, H*0.9);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(1, 'rgba(5,7,13,0.9)');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,W,H);
        // hit flash overlay
        if (hitFlashRef.current > 0.01) {
          hitFlashRef.current *= 0.90;
          ctx.fillStyle = `rgba(255,255,255,${hitFlashRef.current*0.15})`;
          ctx.fillRect(0,0,W,H);
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    const onHit = (_e:Event) => {
      hitFlashRef.current = 1;
    };
    window.addEventListener('liveaudio.hit', onHit as any);
    return ()=> { mounted=false; window.removeEventListener('resize', resize); };
  }, [bars, showWave]);

  return <canvas ref={canvasRef} className={"absolute inset-0 w-full h-full " + className} />;
}

function roundRect(ctx:CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
  ctx.fill();
}
