import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector('#space');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050611);
const camera = new THREE.PerspectiveCamera(48, innerWidth/innerHeight, .1, 1000);
camera.position.set(0, 8, 22);
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping = true; controls.dampingFactor=.045; controls.minDistance=9; controls.maxDistance=38;
controls.target.set(0,0,0);

// Star field
const starGeo = new THREE.BufferGeometry(), starPositions=[];
for(let i=0;i<2600;i++){const r=100*Math.random(),a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1);starPositions.push(r*Math.sin(b)*Math.cos(a),r*Math.cos(b),r*Math.sin(b)*Math.sin(a));}
starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xc7d8ff,size:.11,transparent:true,opacity:.8})));

const hole = new THREE.Mesh(new THREE.SphereGeometry(2.05,64,64),new THREE.MeshBasicMaterial({color:0x000000}));
scene.add(hole);
const glow = new THREE.Mesh(new THREE.SphereGeometry(2.22,64,64),new THREE.MeshBasicMaterial({color:0x17132c,transparent:true,opacity:.42,side:THREE.BackSide}));
scene.add(glow);

// Accretion disk: layered translucent rings and glowing particles
const disk = new THREE.Group(); scene.add(disk);
const ringColors=[0x3d8cff,0x7a42ff,0xff6a35,0xffc36b,0x9b4dff];
for(let j=0;j<5;j++){
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.65+j*.19,2.82+j*.19,180),new THREE.MeshBasicMaterial({color:ringColors[j],side:THREE.DoubleSide,transparent:true,opacity:.13-j*.012,blending:THREE.AdditiveBlending,depthWrite:false}));
  ring.rotation.x=-Math.PI/2+.16; disk.add(ring);
}
const particleCount=2400, positions=new Float32Array(particleCount*3), colors=new Float32Array(particleCount*3), radii=new Float32Array(particleCount), angles=new Float32Array(particleCount), phases=new Float32Array(particleCount);
const palette=[new THREE.Color(0x6c8dff),new THREE.Color(0xb15cff),new THREE.Color(0xff713d),new THREE.Color(0xffd18a)];
for(let i=0;i<particleCount;i++){radii[i]=2.7+Math.random()*3.6;angles[i]=Math.random()*Math.PI*2;phases[i]=Math.random()*Math.PI*2;const c=palette[Math.floor(Math.random()*palette.length)];colors.set([c.r,c.g,c.b],i*3);}
const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));pGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
const particles=new THREE.Points(pGeo,new THREE.PointsMaterial({size:.055,vertexColors:true,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));
disk.add(particles);disk.rotation.x=.12;

const pointLight=new THREE.PointLight(0x7a6cff,35,30);pointLight.position.set(0,3,2);scene.add(pointLight);
const rimLight=new THREE.PointLight(0xff7b45,22,24);rimLight.position.set(0,-2,-3);scene.add(rimLight);

let gravity=1,speed=1,intensity=.75,paused=false;
const $=id=>document.getElementById(id);
$('gravity').addEventListener('input',e=>{gravity=+e.target.value;$('gravityValue').textContent=gravity.toFixed(1)+'×';});
$('speed').addEventListener('input',e=>{speed=+e.target.value;$('speedValue').textContent=speed.toFixed(1)+'×';});
$('brightness').addEventListener('input',e=>{intensity=+e.target.value/100;$('brightnessValue').textContent=e.target.value+'%';});
$('pauseBtn').addEventListener('click',()=>{paused=!paused;$('pauseBtn').innerHTML=paused?'▶ &nbsp; RESUME':'Ⅱ &nbsp; PAUSE';});
$('resetBtn').addEventListener('click',()=>{gravity=1;speed=1;intensity=.75;paused=false;for(const [id,v] of [['gravity',1],['speed',1],['brightness',75]])$(id).value=v;$('gravityValue').textContent='1.0×';$('speedValue').textContent='1.0×';$('brightnessValue').textContent='75%';$('pauseBtn').innerHTML='Ⅱ &nbsp; PAUSE';camera.position.set(0,8,22);controls.target.set(0,0,0);});
$('particleCount').textContent=particleCount.toLocaleString();

const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);if(!paused){
  disk.rotation.y+=dt*.12*speed;
  const pos=pGeo.attributes.position.array;
  for(let i=0;i<particleCount;i++){const r=radii[i];angles[i]+=dt*speed*(.45+2.2/(r*r))*gravity;const a=angles[i],wobble=Math.sin(a*3+phases[i])*.07;pos[i*3]=Math.cos(a)*r;pos[i*3+1]=wobble+(r-4.3)*.035;pos[i*3+2]=Math.sin(a)*r*.43;}
  pGeo.attributes.position.needsUpdate=true;
  particles.material.opacity=.55+intensity*.55;
  particles.material.size=.025+intensity*.04;
  pointLight.intensity=25+intensity*18;
}
controls.update();renderer.render(scene,camera);}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
