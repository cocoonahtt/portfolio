/* Real extruded geometry, transparent WebGL, bounded cell-local motion. */
(() => {
window.CoraGrid3D=function(host,background,interactive){
 const T=window.THREE, clean=[];let disposed=false,raf=0,visible=true;
 const bg=document.createElement('img');bg.className='metal-background';bg.src=background;bg.alt='CORA CHEN 银色金属格架';host.append(bg);
 if(!T||!window.CORA_FONT){const note=document.createElement('span');note.textContent='3D 字母资源未加载，请刷新页面';host.append(note);return()=>{}}
 let renderer;try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'})}catch(error){const note=document.createElement('span');note.textContent='浏览器未启用 WebGL，暂时无法显示 3D 字母';host.append(note);return()=>{}}
 renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.domElement.className='grid-webgl';renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
 const scene=new T.Scene(),camera=new T.OrthographicCamera(0,1536,1024,0,.1,3000);camera.position.set(0,0,1800);camera.lookAt(0,0,0);
 // Large photographic softboxes, no noisy texture or baked image shadows.
 const studio=new T.Scene();studio.background=new T.Color('#6f6c66');const studioItems=[];
 function panel(x,y,z,w,h,intensity,rx=0,ry=0){const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(intensity,intensity,intensity),side:T.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,0);studio.add(mesh);studioItems.push(mesh)}
 // Broad, softly blurred studio cards reproduce satin silver without black chrome outlines.
 panel(-130,100,300,230,500,1.65,0,.15);
 panel(220,40,220,160,450,.8,0,-.3);
 panel(0,250,50,500,220,2.4,Math.PI/2);
 panel(0,-230,80,500,180,.2,Math.PI/2);
 panel(70,-10,320,180,500,.65);
 const pmrem=new T.PMREMGenerator(renderer);const env=pmrem.fromScene(studio,.12,.1,1000);scene.environment=env.texture;pmrem.dispose();studioItems.forEach(m=>{m.geometry.dispose();m.material.dispose()});
 scene.add(new T.HemisphereLight(0xffffff,0x777777,.35));const light=new T.DirectionalLight(0xffffff,.7);light.position.set(-300,600,800);scene.add(light);
 const material=new T.MeshStandardMaterial({color:0xc9c6c1,metalness:1,roughness:.34,envMapIntensity:1});
 const edgeMaterial=new T.MeshStandardMaterial({color:0xdad7d2,metalness:1,roughness:.36,envMapIntensity:1.18});
 // Fine machining marks: low-amplitude, short horizontal scratches, never a baked light gradient.
 const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=1024;
 const grain=grainCanvas.getContext('2d');grain.fillStyle='#808080';grain.fillRect(0,0,1024,1024);
 let seed=57291;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<17000;i++){const x=random()*1024,y=random()*1024,length=2+random()*75;const gray=112+Math.floor(random()*33);grain.strokeStyle=`rgba(${gray},${gray},${gray},.35)`;grain.lineWidth=.35+random()*.45;grain.beginPath();grain.moveTo(x,y);grain.lineTo(x+length,y+(random()-.5)*.4);grain.stroke()}
 const grainTexture=new T.CanvasTexture(grainCanvas);grainTexture.wrapS=grainTexture.wrapT=T.RepeatWrapping;grainTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 material.bumpMap=grainTexture;material.bumpScale=.10;
 edgeMaterial.bumpMap=grainTexture;edgeMaterial.bumpScale=.065;
 const shapes=[['C',2,1,'flip'],['O',6,1,'spin'],['R',4,2,'turn'],['A',1,3,'flip'],['C',5,3,'spin'],['H',3,4,'spin'],['E',7,4,'flip'],['N',5,5,'turn']];
 const xs=[237,390,545,698,852,1008,1163,1306],ys=[177,311,446,583,724,850];const states=[];const media=matchMedia('(prefers-reduced-motion:reduce)');
 function outline(ch){const path=new T.ShapePath(),tokens=window.CORA_FONT.glyphs[ch].o.split(' ');let i=0;const n=()=>Number(tokens[i++]);while(i<tokens.length){const cmd=tokens[i++];if(cmd==='m')path.moveTo(n(),n());else if(cmd==='l')path.lineTo(n(),n());else if(cmd==='q'){const x=n(),y=n(),cx=n(),cy=n();path.quadraticCurveTo(cx,cy,x,y)}else if(cmd==='b'){const x=n(),y=n(),a=n(),b=n(),c=n(),d=n();path.bezierCurveTo(a,b,c,d,x,y)}}return path.toShapes();}
 function listen(target,event,fn){target.addEventListener(event,fn);clean.push(()=>target.removeEventListener(event,fn))}
 for(const [ch,col,row,motion]of shapes){
  const cell={x:xs[col-1]+5,y:ys[row-1]+4,w:xs[col]-xs[col-1]-10,h:ys[row]-ys[row-1]-9};
  const geometry=new T.ExtrudeGeometry(outline(ch),{depth:210,bevelEnabled:true,bevelThickness:30,bevelSize:38,bevelSegments:4,steps:1,curveSegments:24});geometry.computeBoundingBox();const size=geometry.boundingBox.getSize(new T.Vector3());const scale=Math.min(Math.min(110,cell.h-12)/size.y,116/size.x);geometry.center();geometry.scale(scale,scale,scale);geometry.computeBoundingBox();const dim=geometry.boundingBox.getSize(new T.Vector3());
  if(true){const fit=Math.min(1,(Math.min(cell.w,cell.h)-6)/Math.hypot(dim.x,dim.y,dim.z));geometry.scale(fit,fit,fit);geometry.computeBoundingBox();geometry.boundingBox.getSize(dim)}
  // A very subtle crown on the broad polished faces catches broad reflections instead of flat gray.
  const positions=geometry.attributes.position,normals=geometry.attributes.normal;
  const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,positions.getX(i)/110+.5,positions.getY(i)/110+.5);uv.needsUpdate=true;
  for(let i=0;i<normals.count;i++){const nz=normals.getZ(i);if(Math.abs(nz)>.999){const nx=positions.getX(i)/dim.x*.32,ny=positions.getY(i)/dim.y*.10;const normal=new T.Vector3(nx,ny,nz).normalize();normals.setXYZ(i,normal.x,normal.y,normal.z)}}normals.needsUpdate=true;
  const mesh=new T.Mesh(geometry,[material,edgeMaterial]);const centerX=cell.x+cell.w/2,baseline=cell.y+cell.h-5,centerY=1024-baseline+dim.y/2;
  mesh.position.set(centerX,centerY,0);mesh.rotation.set(.07,-.16,0);scene.add(mesh);
  const baseQuaternion=mesh.quaternion.clone();const axis=new T.Vector3(motion==='flip'?1:0,motion==='turn'?1:0,motion==='spin'?1:0);
  const localBounds=geometry.boundingBox.clone(),rotatedBounds=new T.Box3(),rotationMatrix=new T.Matrix4();
  const hit=document.createElement('a');
  hit.className='grid-hit grid-hit-3d';
  if(interactive) hit.href='#/about';
  hit.dataset.letter=ch;hit.dataset.motion=motion;hit.dataset.geometry='extruded';hit.dataset.depth=dim.z.toFixed(2);hit.setAttribute('aria-label', ch + ' · 查看 About');hit.tabIndex=interactive?0:-1;Object.assign(hit.style,{left:cell.x/1536*100+'%',top:cell.y/1024*100+'%',width:cell.w/1536*100+'%',height:cell.h/1024*100+'%'});host.append(hit);
  const s={mesh,hit,motion,hover:false,focus:false,touch:false,phase:0,turn:-.16,centerY,baseQuaternion,axis,localBounds,rotatedBounds,rotationMatrix,bottom:1024-cell.y-cell.h+2,top:1024-cell.y-2,running:false,wasActive:false};states.push(s);
  const start=()=>{if(!raf&&!disposed&&visible)raf=requestAnimationFrame(tick)};
  listen(hit,'pointerenter',e=>{if(e.pointerType!=='touch'){s.hover=true;start()}});listen(hit,'pointerleave',()=>{s.hover=false;start()});listen(hit,'focus',()=>{s.focus=hit.matches(':focus-visible');start()});listen(hit,'blur',()=>{s.focus=false;s.touch=false;start()});
 }
 // A small blush-pink glass marble, resting on the shelf immediately to A's right.
 const ballRadius=20,ballStart=xs[1]+ballRadius+8,ballEnd=xs[2]-ballRadius-10,ballY=1024-573+ballRadius;
 const ball=new T.Group();ball.position.set(ballStart,ballY,12);scene.add(ball);
 const shell=new T.Mesh(new T.SphereGeometry(ballRadius,48,32),new T.MeshPhysicalMaterial({color:0xf2b7cd,metalness:0,roughness:.07,transmission:.45,thickness:24,ior:1.48,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:1.5}));ball.add(shell);
 const core=new T.Mesh(new T.TorusGeometry(8.8,2.8,12,48),new T.MeshStandardMaterial({color:0xc86e96,metalness:.15,roughness:.25}));core.rotation.set(.55,.6,.4);ball.add(core);
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=32;const sc=shadowCanvas.getContext('2d'),gradient=sc.createRadialGradient(64,16,1,64,16,62);gradient.addColorStop(0,'rgba(0,0,0,.25)');gradient.addColorStop(1,'rgba(0,0,0,0)');sc.fillStyle=gradient;sc.fillRect(0,0,128,32);
 const shadowTexture=new T.CanvasTexture(shadowCanvas);const shadow=new T.Sprite(new T.SpriteMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.scale.set(54,8,1);shadow.position.set(ballStart,1024-573,1);scene.add(shadow);
 const ballLink=document.createElement('a');ballLink.className='grid-hit marble-link';ballLink.href='#/projects';ballLink.setAttribute('aria-label','玻璃球 · 查看 Projects');ballLink.title='Projects';ballLink.dataset.radius=String(ballRadius);ballLink.dataset.duration='1.05';ballLink.tabIndex=interactive?0:-1;
 Object.assign(ballLink.style,{left:(xs[1]+5)/1536*100+'%',top:(573-ballRadius*2-6)/1024*100+'%',width:(xs[2]-xs[1]-10)/1536*100+'%',height:(ballRadius*2+10)/1024*100+'%'});host.append(ballLink);
 let ballPhase=0,ballRunning=false;
 function rollBall(){if(!interactive||media.matches||ballRunning)return;ballPhase=0;ballRunning=true;draw()}
 listen(ballLink,'pointerenter',rollBall);listen(ballLink,'focus',rollBall);
 if(!interactive)listen(ballLink,'click',e=>e.preventDefault());
 let last=0;
 function tick(now){raf=0;if(disposed)return;const dt=Math.min((now-last)/1000||.016,.04);last=now;let moving=false;
  for(const s of states){const active=interactive&&!media.matches&&(s.hover||s.focus||s.touch);
   {
    if(active&&!s.wasActive&&!s.running){s.phase=0;s.running=true}
    if(s.running){s.phase=Math.min(1,s.phase+dt/1.05);if(s.phase===1)s.running=false;else moving=true}
    const angle=window.CoraLetterMotion(s.phase,s.motion);
    s.mesh.quaternion.setFromAxisAngle(s.axis,angle).multiply(s.baseQuaternion);
    // Clamp the rotated volume inside the cell, with a small natural lift off the shelf.
    s.rotationMatrix.makeRotationFromQuaternion(s.mesh.quaternion);s.rotatedBounds.copy(s.localBounds).applyMatrix4(s.rotationMatrix);
    s.mesh.position.y=Math.max(s.bottom-s.rotatedBounds.min.y,Math.min(s.centerY,s.top-s.rotatedBounds.max.y));
    s.hit.dataset.rotation=angle.toFixed(3);s.hit.dataset.running=String(s.running);
   }
   s.wasActive=active;s.hit.dataset.axis=s.motion==='turn'?'y':s.motion==='flip'?'x':'z';
   s.hit.dataset.angle=s.mesh.rotation.y.toFixed(3);s.hit.dataset.offset=(s.mesh.position.y-s.centerY).toFixed(2);
  }
  if(ballRunning){ballPhase=Math.min(1,ballPhase+dt/1.05);const leg=ballPhase<.5?ballPhase*2:2-ballPhase*2;const travel=leg<.5?4*leg*leg*leg:1-Math.pow(-2*leg+2,3)/2;ball.position.x=ballStart+(ballEnd-ballStart)*travel;ball.rotation.z=-(ball.position.x-ballStart)/ballRadius;shadow.position.x=ball.position.x;ballLink.dataset.progress=ballPhase.toFixed(3);ballLink.dataset.x=ball.position.x.toFixed(2);if(ballPhase===1)ballRunning=false;else moving=true}
  renderer.render(scene,camera);if(moving&&visible)raf=requestAnimationFrame(tick);
 }
 function draw(){if(!raf&&!disposed&&visible)raf=requestAnimationFrame(tick)}
 const ro=new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight,false);draw()});ro.observe(host);
 listen(media,'change',()=>{ballRunning=false;ballPhase=0;ball.position.x=ballStart;ball.rotation.z=0;shadow.position.x=ballStart;states.forEach(s=>{s.phase=0;s.running=false;s.wasActive=false;s.mesh.rotation.set(.07,-.16,0);s.mesh.position.y=s.centerY;s.turn=-.16});draw()});
 listen(document,'visibilitychange',()=>{visible=!document.hidden;if(!visible){cancelAnimationFrame(raf);raf=0}else draw()});draw();
 return()=>{disposed=true;cancelAnimationFrame(raf);ro.disconnect();clean.forEach(fn=>fn());states.forEach(s=>s.mesh.geometry.dispose());shell.geometry.dispose();shell.material.dispose();core.geometry.dispose();core.material.dispose();shadow.material.dispose();shadowTexture.dispose();material.dispose();edgeMaterial.dispose();grainTexture.dispose();env.dispose();renderer.dispose();renderer.domElement.remove()};
};
})();
