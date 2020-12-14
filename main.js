import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/GLTFLoader.js';


function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});

  const fov = 30;
  const aspect = 2; 
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(-15, 0, -120);


  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.update();


  controls.screenSpacePanning = false;
	controls.maxPolarAngle = Math.PI / 2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('white');

  scene.fog=new THREE.Fog( 0xffffff, 1, 100 );


  {
    const skyColor = 0xB1E1FF;  
    const groundColor = 0xB97A20;  
    const intensity = 0.4;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
  }

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(5, 10, -30);
    scene.add(light);
    scene.add(light.target);
  }

  const light = new THREE.AmbientLight( 0x404040, 1.4  ); 
  scene.add( light )

  function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.2;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * 1);
    const distance = halfSizeToFitOnScreen;
 
    const direction = (new THREE.Vector3())
        .subVectors(camera.position, boxCenter)
        .multiply(new THREE.Vector3(1, 0, 1))
        .normalize();
    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

    camera.near = boxSize / 100;
    camera.far = boxSize * 10;
    camera.updateProjectionMatrix();

    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
  }

  
  {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('main.gltf', (gltf) => {
      const root = gltf.scene;
      scene.add(root);


      const box = new THREE.Box3().setFromObject(root);

      const boxSize = box.getSize(new THREE.Vector3()).length();
      const boxCenter = box.getCenter(new THREE.Vector3());

      frameArea(boxSize * 0.5, boxSize, boxCenter, camera);

      controls.maxDistance = boxSize ;
      controls.target.copy(boxCenter);
      controls.update();

      
    });
  }


  
  const boxWidth = 0.001;
  const boxHeight = 0.001;
  const boxDepth = 0.001;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  const labelContainerElem = document.querySelector('#labels');

  function makeInstance(geometry, color, x,y,z, name) {
    const material = new THREE.MeshPhongMaterial({color});

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;
    cube.position.y= y;
    cube.position.z = z;

    const elem = document.createElement('div');
    elem.textContent = name;
    labelContainerElem.appendChild(elem);

    return {cube, elem};
  }

  const cubes = [
    makeInstance(geometry, 0x44aa88,  -12,1,2, 'Building 2'),
    makeInstance(geometry, 0x8844aa, -4, 1, 0, 'Building 1'),
    makeInstance(geometry, 0xaa8844,  -6,1,0, 'Library'),
    makeInstance(geometry, 0xaa8844,  -7,1,5, 'Gallery'),
    makeInstance(geometry, 0xaa8844,  -3.3,1,8, 'Building 5'),
    makeInstance(geometry, 0xaa8844,  -12,1,9, 'Building 3'),
    makeInstance(geometry, 0xaa8844,  -12,1,19.4, 'Building 4'),
    makeInstance(geometry, 0xaa8844,  -1.2, 1, 4, 'Physical education'),
    makeInstance(geometry, 0xaa8844,  6, 1, 19, 'Dormitory 2'),
    makeInstance(geometry, 0xaa8844,  1, 1, 17, 'Dormitory 1'),
    makeInstance(geometry, 0xaa8844,  -3.3, 1, 18.5, 'Dormitory 3'),
    makeInstance(geometry, 0xaa8844,  -2, 1, 26, 'Dormitory 4'),
    makeInstance(geometry, 0xaa8844,  -4, 1, 22, 'Dining room'),
    makeInstance(geometry, 0xaa8844,  7, 1, 0, 'Stadium'),
    makeInstance(geometry, 0xaa8844, -3.3, 1, 15, 'Medical post'),
  ];

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

 const state = {
    time: 0,
  };
   

  const elem = document.querySelector('#screenshot');
  elem.addEventListener('click', () => {
    render();
    canvas.toBlob((blob) => {
      saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
    });
  });

  const saveBlob = (function() {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    return function saveData(blob, fileName) {
       const url = window.URL.createObjectURL(blob);
       a.href = url;
       a.download = fileName;
       a.click();
    };
  }());

  const tempV = new THREE.Vector3();

  function render(time) {
    state.time *= 0.001;
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    cubes.forEach((cubeInfo, ndx) => {
      const {cube, elem} = cubeInfo;
      cube.updateWorldMatrix(true, false);
      cube.getWorldPosition(tempV);

      tempV.project(camera);
      const x = (tempV.x *  .5 + .5) * canvas.clientWidth;
      const y = (tempV.y * -.5 + .5) * canvas.clientHeight;

      elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
    });
    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
