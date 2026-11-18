import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// TRUE 3D HERO: the real portrait texture appears clearly after a particle assembly.
const canvas = document.querySelector('#threeCanvas');
const stage = document.querySelector('.hero-stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(stage.clientWidth, stage.clientHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, stage.clientWidth / stage.clientHeight, 0.1, 100);
camera.position.set(0, 0, 10.0);
scene.add(new THREE.AmbientLight(0xffffff, 1.7));
const goldLight = new THREE.PointLight(0xffbd4a, 38, 18);
goldLight.position.set(-1.5, 2.5, 5);
scene.add(goldLight);
const rimLight = new THREE.PointLight(0x8d5318, 26, 16);
rimLight.position.set(3, -1, -2);
scene.add(rimLight);

const portraitGroup = new THREE.Group();
portraitGroup.position.x = -0.55;
scene.add(portraitGroup);
let particlePoints = null;
let scatterPositions = null;
let targetPositions = null;
let portraitMaterial = null;
let particleMaterial = null;
let portraitReadyAt = null;

const portraitTexture = new THREE.TextureLoader().load('./assets/triveni-portrait-bw.png', (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const portrait = new THREE.Mesh(
    new THREE.PlaneGeometry(6.05, 6.05),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, alphaTest: 0.015, depthWrite: false, side: THREE.DoubleSide })
  );
  portrait.position.set(0, 0, 0.22);
  portraitMaterial = portrait.material;
  portraitGroup.add(portrait);

  // Build a dense point cloud from the actual transparent portrait image.
  const sampleCanvas = document.createElement('canvas');
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const sw = 220, sh = 220;
  sampleCanvas.width = sw;
  sampleCanvas.height = sh;
  sampleCtx.drawImage(texture.image, 0, 0, sw, sh);
  const pixels = sampleCtx.getImageData(0, 0, sw, sh).data;
  const points = [], colors = [];
  for (let y = 3; y < sh - 2; y += 1) {
    for (let x = 3; x < sw - 2; x += 1) {
      const k = (y * sw + x) * 4;
      const alpha = pixels[k + 3] / 255;
      if (alpha < 0.18) continue;
      const brightness = (pixels[k] + pixels[k + 1] + pixels[k + 2]) / 765;
      // Match the image proportions and preserve the face/hair/clothing detail.
      points.push((x - sw / 2) / 36.3, -(y - sh / 2) / 36.3, (Math.random() - 0.5) * 0.08);
      const glow = 0.72 + brightness * 0.28;
      colors.push(glow, glow * 0.88, glow * 0.68);
    }
  }

  targetPositions = new Float32Array(points);
  scatterPositions = new Float32Array(points.length);
  const startPositions = new Float32Array(points.length);
  for (let i = 0; i < points.length; i += 3) {
    scatterPositions[i] = points[i] + (Math.random() - 0.5) * 8.5;
    scatterPositions[i + 1] = points[i + 1] + (Math.random() - 0.5) * 8.5;
    scatterPositions[i + 2] = (Math.random() - 0.5) * 8;
    startPositions[i] = scatterPositions[i];
    startPositions[i + 1] = scatterPositions[i + 1];
    startPositions[i + 2] = scatterPositions[i + 2];
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(startPositions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  particleMaterial = new THREE.PointsMaterial({ size: 0.018, vertexColors: true, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  particlePoints = new THREE.Points(geometry, particleMaterial);
  portraitGroup.add(particlePoints);
  portraitReadyAt = clock.getElapsedTime();
});

// 3D transformer-inspired sculpture, placed behind the portrait.
const machine = new THREE.Group();
scene.add(machine);
machine.position.set(2.65, -0.35, -1.45);
machine.scale.setScalar(0.62);
const metal = new THREE.MeshStandardMaterial({ color: 0xb18a42, metalness: 0.9, roughness: 0.24 });
const darkMetal = new THREE.MeshStandardMaterial({ color: 0x242820, metalness: 0.8, roughness: 0.3 });
const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.65, 0.85), darkMetal);
machine.add(body);
for (let i = -2; i <= 2; i++) {
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.055, 10, 64), metal);
  coil.rotation.x = Math.PI / 2;
  coil.position.y = i * 0.19;
  machine.add(coil);
}
const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1), metal);
top.position.y = 0.88;
machine.add(top);
const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.13, 1.1), metal);
base.position.y = -0.9;
machine.add(base);

const orbitGroup = new THREE.Group();
scene.add(orbitGroup);
orbitGroup.position.set(0.15, -0.15, -1.8);
for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.0 + i * 0.18, 0.009, 6, 180),
    new THREE.MeshBasicMaterial({ color: i === 1 ? 0xe8b84f : 0x85652f, transparent: true, opacity: 0.42 })
  );
  ring.rotation.x = 0.82 + i * 0.12;
  ring.rotation.y = i * 0.35;
  orbitGroup.add(ring);
}

const starGeo = new THREE.BufferGeometry();
const starArray = [];
for (let i = 0; i < 1100; i++) starArray.push((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10 - 2);
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starArray, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xe8b84f, size: 0.018, transparent: true, opacity: 0.72 }));
scene.add(stars);

let pointerX = 0, pointerY = 0, scrollFactor = 0;
stage.addEventListener('pointermove', e => {
  const r = stage.getBoundingClientRect();
  pointerX = (e.clientX - r.left) / r.width - 0.5;
  pointerY = (e.clientY - r.top) / r.height - 0.5;
});
window.addEventListener('scroll', () => { scrollFactor = Math.min(window.scrollY / 900, 0.35); });
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  if (particlePoints && portraitReadyAt !== null) {
    const elapsed = t - portraitReadyAt;
    const assemble = THREE.MathUtils.smoothstep(elapsed, 0.35, 3.6);
    const p = particlePoints.geometry.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      p[i] = THREE.MathUtils.lerp(scatterPositions[i], targetPositions[i], assemble);
      p[i + 1] = THREE.MathUtils.lerp(scatterPositions[i + 1], targetPositions[i + 1], assemble);
      p[i + 2] = THREE.MathUtils.lerp(scatterPositions[i + 2], targetPositions[i + 2], assemble) + Math.sin(t * 1.4 + i * 0.018) * (1 - assemble) * 0.08;
    }
    particlePoints.geometry.attributes.position.needsUpdate = true;
    // At the end of the particle entrance, fade up the actual full-resolution photo.
    const photoFade = THREE.MathUtils.smoothstep(elapsed, 2.6, 4.3);
    if (portraitMaterial) portraitMaterial.opacity = photoFade;
    particleMaterial.opacity = 1 - photoFade * 0.92;
    particlePoints.rotation.y = Math.sin(t * 0.25) * 0.035;
  }
  machine.rotation.y = t * 0.32;
  machine.rotation.x = Math.sin(t * 0.45) * 0.06;
  orbitGroup.rotation.z = t * 0.08;
  stars.rotation.y = t * 0.009;
  camera.position.x += (pointerX * 0.34 - camera.position.x) * 0.025;
  camera.position.y += (-pointerY * 0.22 - camera.position.y) * 0.025;
  camera.position.z = 10.0 + scrollFactor;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}
animate();
window.addEventListener('resize', () => {
  const w = stage.clientWidth, h = stage.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
});

// EV harmonic waveform animation (illustrative only).
const wave=document.getElementById('waveCanvas'),ctx=wave.getContext('2d');let fuzzy=false,phase=0;
function resizeWave(){const r=wave.getBoundingClientRect(),d=window.devicePixelRatio||1;wave.width=r.width*d;wave.height=r.height*d;ctx.setTransform(d,0,0,d,0,0)}
function drawWave(){const w=wave.clientWidth,h=wave.clientHeight,c=h/2;ctx.clearRect(0,0,w,h);ctx.strokeStyle='#252a22';ctx.lineWidth=1;for(let x=0;x<w;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
 const draw=(color,isCurrent)=>{ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=isCurrent?2.5:1.8;for(let x=0;x<w;x++){const a=x/w*Math.PI*4-phase;let v=Math.sin(a);if(isCurrent)v+=fuzzy?.05*Math.sin(3*a)+.025*Math.sin(5*a)+.01*Math.sin(7*a):.35*Math.sin(3*a)+.22*Math.sin(5*a)+.12*Math.sin(7*a);const y=c-v*62;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke()};draw('#e8b84f',false);draw(fuzzy?'#73d49b':'#e34b4b',true);phase+=.035;requestAnimationFrame(drawWave)}
function setFuzzy(on){fuzzy=on;document.getElementById('withoutFuzzy').classList.toggle('active',!on);document.getElementById('withFuzzy').classList.toggle('active',on);document.getElementById('thdValue').textContent=on?'4.8%':'28.4%';document.getElementById('pfValue').textContent=on?'0.98':'0.82';document.getElementById('controlMode').textContent=on?'ENABLED':'DISABLED'}
document.getElementById('withoutFuzzy').onclick=()=>setFuzzy(false);document.getElementById('withFuzzy').onclick=()=>setFuzzy(true);resizeWave();drawWave();window.addEventListener('resize',resizeWave);

// GridGuard-X alarm: user gesture starts an alternating audible tone; normal/reset stops it.
let audioCtx=null,osc=null,gain=null,alarmInterval=null;
function logEvent(msg){const el=document.createElement('p');el.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`;const log=document.getElementById('eventLog');log.prepend(el);while(log.children.length>7)log.lastChild.remove()}
function stopAlarm(){if(alarmInterval)clearInterval(alarmInterval);alarmInterval=null;if(gain&&audioCtx){gain.gain.setTargetAtTime(0,audioCtx.currentTime,.04)}if(osc){try{osc.stop()}catch(e){}osc=null}gain=null;document.getElementById('alarmState').textContent='ALARM: OFF';document.getElementById('alarmState').style.color='#8ce0a6'}
async function startAlarm(){stopAlarm();try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('Web Audio unavailable');audioCtx=audioCtx||new AC();if(audioCtx.state==='suspended')await audioCtx.resume();osc=audioCtx.createOscillator();gain=audioCtx.createGain();osc.type='square';osc.frequency.value=850;gain.gain.value=.035;osc.connect(gain);gain.connect(audioCtx.destination);osc.start();let high=true;alarmInterval=setInterval(()=>{if(osc&&audioCtx){high=!high;osc.frequency.setTargetAtTime(high?1000:650,audioCtx.currentTime,.02)}},350);document.getElementById('alarmState').textContent='ALARM: SOUNDING';document.getElementById('alarmState').style.color='#ff7373';logEvent('AUDIBLE FAULT ALARM ACTIVATED')}catch(e){logEvent('Audio could not start: '+e.message)}}
function buttons(active){['normalBtn','faultABtn','faultBBtn'].forEach(id=>document.getElementById(id).classList.toggle('active',id===active))}
function normal(){stopAlarm();['A','B'].forEach(k=>{document.getElementById('feeder'+k).classList.remove('fault');document.getElementById('breaker'+k).textContent=`BREAKER ${k} — CLOSED`;document.getElementById('status'+k).textContent='HEALTHY'});document.getElementById('gridStatus').textContent='ALL FEEDERS HEALTHY';document.getElementById('gridStatus').style.color='#8ce0a6';buttons('normalBtn');logEvent('Both feeders operational; alarm stopped')}
function fault(which){const other=which==='A'?'B':'A';document.getElementById('feeder'+which).classList.add('fault');document.getElementById('feeder'+other).classList.remove('fault');document.getElementById('breaker'+which).textContent=`BREAKER ${which} — OPEN`;document.getElementById('breaker'+other).textContent=`BREAKER ${other} — CLOSED`;document.getElementById('status'+which).textContent='FAULT / ISOLATED';document.getElementById('status'+other).textContent='HEALTHY';document.getElementById('gridStatus').textContent=`FEEDER ${which} FAULT DETECTED — ISOLATED`;document.getElementById('gridStatus').style.color='#ff7373';buttons('fault'+which+'Btn');logEvent(`WARNING: fault detected in Feeder ${which}`);logEvent(`Breaker ${which} opened; healthy Feeder ${other} remains shown operational`);startAlarm()}
document.getElementById('normalBtn').onclick=normal;document.getElementById('faultABtn').onclick=()=>fault('A');document.getElementById('faultBBtn').onclick=()=>fault('B');document.getElementById('resetGridBtn').onclick=()=>{normal();logEvent('GridGuard-X reset completed')};

// Smart Reader OCR + browser speech.
let selectedImage=null;const imageInput=document.getElementById('imageUpload'),preview=document.getElementById('previewImage'),textArea=document.getElementById('extractedText'),ocrStatus=document.getElementById('ocrStatus'),progress=document.getElementById('ocrProgress');
imageInput.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(!f.type.startsWith('image/')){ocrStatus.textContent='Please choose an image file.';return}selectedImage=f;preview.src=URL.createObjectURL(f);preview.style.display='block';textArea.value='';progress.style.width='0%';ocrStatus.textContent='Image uploaded. Ready to extract.'});
document.getElementById('extractTextBtn').onclick=async()=>{if(!selectedImage){ocrStatus.textContent='Upload an image first.';return}if(!window.Tesseract){ocrStatus.textContent='OCR library unavailable. Check internet connection.';return}const btn=document.getElementById('extractTextBtn');btn.disabled=true;btn.textContent='PROCESSING...';try{const result=await Tesseract.recognize(selectedImage,'eng',{logger:m=>{if(m.status)ocrStatus.textContent=m.status;if(m.progress!==undefined)progress.style.width=Math.round(m.progress*100)+'%'}});textArea.value=result.data.text;progress.style.width='100%';ocrStatus.textContent='Text extraction completed.'}catch(e){console.error(e);ocrStatus.textContent='OCR failed. Try another image.'}finally{btn.disabled=false;btn.textContent='EXTRACT TEXT'}};
document.getElementById('readTextBtn').onclick=()=>{const t=textArea.value.trim();if(!t){ocrStatus.textContent='No text to read.';return}if(!('speechSynthesis'in window)){ocrStatus.textContent='Speech is not supported by this browser.';return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-IN';u.rate=.9;speechSynthesis.speak(u);ocrStatus.textContent='Reading text aloud...'};
document.getElementById('pauseSpeechBtn').onclick=()=>{if(!speechSynthesis.speaking)return;if(speechSynthesis.paused){speechSynthesis.resume();ocrStatus.textContent='Speech resumed.'}else{speechSynthesis.pause();ocrStatus.textContent='Speech paused.'}};document.getElementById('stopSpeechBtn').onclick=()=>{speechSynthesis.cancel();ocrStatus.textContent='Speech stopped.'};


// FLASH-ENTRY TYPOGRAPHY: reveal each sentence/section element as it enters view.
function prepareFlashText() {
  const paragraphNodes = document.querySelectorAll('p');
  paragraphNodes.forEach((paragraph) => {
    if (paragraph.children.length || paragraph.closest('.event-log')) return;
    const text = paragraph.textContent.trim();
    if (!text) return;
    const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    paragraph.textContent = '';
    parts.forEach((part, index) => {
      const span = document.createElement('span');
      span.className = 'flash-sentence';
      span.textContent = part.trim();
      span.style.setProperty('--flash-delay', `${index * 110}ms`);
      paragraph.appendChild(span);
      if (index < parts.length - 1) paragraph.appendChild(document.createTextNode(' '));
    });
  });

  const targets = document.querySelectorAll(
    '.hero-copy > *, .section-tag, .section-head > *, .about-quote > *, .about-facts > div, .skill-card, .project > *, .achievement-grid > div, .education-list > div, .contact > *, footer > *'
  );
  targets.forEach((element, index) => {
    element.classList.add('flash-reveal');
    element.style.setProperty('--flash-delay', `${(index % 5) * 85}ms`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('flash-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  targets.forEach((element) => observer.observe(element));

  // The hero copy flashes immediately on page entry.
  document.querySelectorAll('.hero-copy .flash-reveal').forEach((element) => {
    element.classList.add('flash-visible');
  });
}
prepareFlashText();
