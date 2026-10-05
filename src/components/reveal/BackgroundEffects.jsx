import React, { useEffect, useRef } from 'react';

export default function BackgroundEffects({ showFlash = false, confettiActive = false }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const confettiRef = useRef([]);
  const animFrameIdRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvasRef.current) return;
      width = canvasRef.current.width = window.innerWidth;
      height = canvasRef.current.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize 70 floating gold dust particles
    const DUST_COUNT = 70;
    particlesRef.current = Array.from({ length: DUST_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: -0.2 - Math.random() * 0.45,
      alpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      angle: Math.random() * Math.PI * 2
    }));

    // Particle Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Gold Dust Particles
      particlesRef.current.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.angle += p.pulseSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentAlpha = p.alpha + Math.sin(p.angle) * 0.25;
        const boundedAlpha = Math.max(0.1, Math.min(0.9, currentAlpha));

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 206, 102, ${boundedAlpha})`;
        ctx.shadowColor = 'rgba(230, 185, 74, 0.8)';
        ctx.shadowBlur = p.radius * 3;
        ctx.fill();
        ctx.restore();
      });

      // 2. Draw Confetti & Sparkles if active
      if (confettiRef.current.length > 0) {
        for (let i = confettiRef.current.length - 1; i >= 0; i--) {
          const c = confettiRef.current[i];
          c.x += c.vx;
          c.y += c.vy;
          c.vy += c.gravity;
          c.rotation += c.vRot;
          c.life -= c.decay;

          if (c.y > height + 20 || c.life <= 0) {
            confettiRef.current.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(c.rotation);
          ctx.globalAlpha = Math.max(0, Math.min(1, c.life));

          if (c.isSparkle) {
            // Draw 4-point star sparkle
            ctx.fillStyle = c.color;
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 10;
            const r = c.size;
            ctx.beginPath();
            for (let s = 0; s < 4; s++) {
              ctx.lineTo(Math.cos((s * Math.PI) / 2) * r, Math.sin((s * Math.PI) / 2) * r);
              ctx.lineTo(
                Math.cos((s * Math.PI) / 2 + Math.PI / 4) * (r * 0.3),
                Math.sin((s * Math.PI) / 2 + Math.PI / 4) * (r * 0.3)
              );
            }
            ctx.closePath();
            ctx.fill();
          } else {
            // Draw rectangular fluttering confetti
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
          }
          ctx.restore();
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Trigger Confetti Burst when confettiActive changes to true
  useEffect(() => {
    if (!confettiActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width || window.innerWidth;
    const height = canvas.height || window.innerHeight;

    const colors = ['#fff3b0', '#e6b94a', '#ffd700', '#ffffff', '#f7f1e1', '#d4aa46'];
    const newConfetti = [];

    // Confetti falling from top & sides
    for (let i = 0; i < 180; i++) {
      newConfetti.push({
        isSparkle: false,
        x: Math.random() * width,
        y: -10 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2.5,
        gravity: 0.08,
        width: Math.random() * 10 + 6,
        height: Math.random() * 6 + 4,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: 0.0035 + Math.random() * 0.003
      });
    }

    // 4-point star sparkles bursting outward
    for (let j = 0; j < 50; j++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      newConfetti.push({
        isSparkle: true,
        x: width * 0.5 + (Math.random() - 0.5) * (width * 0.6),
        y: height * 0.45 + (Math.random() - 0.5) * (height * 0.3),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.02,
        size: Math.random() * 12 + 8,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.08,
        color: Math.random() > 0.3 ? '#fff3b0' : '#ffffff',
        life: 1.0,
        decay: 0.008 + Math.random() * 0.008
      });
    }

    confettiRef.current = newConfetti;
  }, [confettiActive]);

  return (
    <>
      <div className="reveal-spotlight spotlight-left" />
      <div className="reveal-spotlight spotlight-right" />
      <div className="reveal-vignette" />
      <div className="reveal-frame" />
      <canvas ref={canvasRef} className="reveal-canvas" />
      {showFlash && <div className="reveal-flash" />}
    </>
  );
}
