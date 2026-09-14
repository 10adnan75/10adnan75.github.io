import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/addons/renderers/CSS3DRenderer.js";

// The HTML terminal is composited onto the WebGL monitor screen.
export function createScene(terminal) {
  const host = document.querySelector("#computer-scene");
  const layer = document.querySelector("#terminal-layer");
  const scene = new THREE.Scene();
  const htmlScene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // A small generated studio environment gives the metal its reflections.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.95;
  room.dispose();
  pmrem.dispose();
  host.append(renderer.domElement);
  const htmlRenderer = new CSS3DRenderer();
  layer.replaceChildren(htmlRenderer.domElement);
  htmlRenderer.domElement.classList.add("css3d-renderer");
  htmlRenderer.domElement.firstElementChild.classList.add("css3d-view");
  htmlRenderer.domElement.firstElementChild.firstElementChild.classList.add(
    "css3d-camera",
  );
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
  const computer = new THREE.Group();
  computer.position.set(2.15, -0.55, 0);
  scene.add(computer);
  const dark = new THREE.MeshPhysicalMaterial({
    color: 0xb9bdc7,
    roughness: 0.08,
    metalness: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const rim = new THREE.MeshPhysicalMaterial({
    color: 0xe3e6ec,
    roughness: 0.09,
    metalness: 1,
    clearcoat: 1,
  });
  const keys = new THREE.MeshStandardMaterial({
    color: 0x303030,
    roughness: 0.4,
    metalness: 0.3,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0x878787,
    roughness: 0.3,
    metalness: 0.35,
  });
  const black = new THREE.MeshStandardMaterial({
    color: 0x0b0b0b,
    roughness: 0.65,
  });
  function box(w, h, d, material, x, y, z, r = 0.06) {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(w, h, d, 3, r),
      material,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    computer.add(mesh);
    return mesh;
  }
  // Monitor enclosure.
  box(5.24, 3.72, 0.24, dark, 0, 0.08, 0.08, 0.1);
  // Physical power switch.
  function bezelDisc(radius, depth, material, x, z) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, depth, 32),
      material,
    );
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, -1.51, z);
    mesh.castShadow = true;
    computer.add(mesh);
    return mesh;
  }
  bezelDisc(0.09, 0.002, dark, 2.3, 0.199);
  box(0.65, 0.83, 0.5, dark, 0, -2.18, -0.12, 0.07);
  box(2.4, 0.16, 1.23, rim, 0, -2.59, 0.05, 0.07);
  box(4.4, 0.17, 1.4, dark, 0, -2.65, 1.8, 0.07);
  const keyCaps = [];
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 14; col++) {
      if (row === 4 && col > 3 && col < 10) continue;
      keyCaps.push(
        box(
          0.247,
          0.085,
          0.2,
          (col === 0 && row === 0) || (row === 3 && col === 13)
            ? accentMaterial
            : keys,
          -1.94 + col * 0.298,
          -2.515,
          1.25 + row * 0.24,
          0.025,
        ),
      );
    }
  box(1.72, 0.085, 0.2, keys, 0.1, -2.515, 2.21, 0.025);
  const mouse = box(0.65, 0.28, 1.0, rim, 3.05, -2.54, 1.8, 0.16);
  box(0.03, 0.02, 0.22, black, 3.05, -2.39, 1.62, 0.01);
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    emissive: 0x878787,
    emissiveIntensity: 2,
    roughness: 0.3,
  });
  box(3.9, 0.025, 1.2, glowMaterial, 0, -2.59, 1.8, 0.015);
  box(1.9, 0.025, 0.82, glowMaterial, 0, -2.68, 0.05, 0.015);
  for (let i = 0; i < 20; i++)
    box(0.13, 0.035, 0.02, black, -1.8 + i * 0.19, -1.63, 0.095, 0.008);
  const keyCanvas = document.createElement("canvas");
  keyCanvas.width = 1024;
  keyCanvas.height = 320;
  const keyContext = keyCanvas.getContext("2d");
  keyContext.fillStyle = "#dbdbdb";
  keyContext.textAlign = "center";
  keyContext.font = "16px monospace";
  [
    "esc 1 2 3 4 5 6 7 8 9 0 - = del",
    "tab Q W E R T Y U I O P [ ] \u005c",
    'caps A S D F G H J K L ; \" enter',
    "shift Z X C V B N M , . / up shift",
    "ctrl fn alt cmd       cmd alt left down right",
  ].forEach((row, r) =>
    row
      .split(" ")
      .forEach((key, c) => keyContext.fillText(key, 39 + c * 72, 30 + r * 60)),
  );
  const keyTexture = new THREE.CanvasTexture(keyCanvas);
  const legends = new THREE.Mesh(
    new THREE.PlaneGeometry(4.25, 1.25),
    new THREE.MeshBasicMaterial({
      map: keyTexture,
      transparent: true,
      depthWrite: false,
    }),
  );
  legends.rotation.x = -Math.PI / 2;
  legends.position.set(0, -2.465, 1.76);
  computer.add(legends);
  const ambient = new THREE.HemisphereLight(0xd7d7d7, 0x0f0f0f, 1.6);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xe8e8e8, 3);
  key.position.set(-3, 7, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -9;
  key.shadow.camera.right = 9;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  key.shadow.normalBias = 0.035;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x878787, 3);
  fill.position.set(7, 3, -1);
  scene.add(fill);
  const back = new THREE.PointLight(0x6d6d6d, 18, 15);
  back.position.set(3, 1, -3);
  scene.add(back);
  const screenLight = new THREE.PointLight(0x999999, 5, 7);
  screenLight.position.set(2.15, -0.2, 2);
  scene.add(screenLight);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: 0.35 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.32;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(24, 40, 0x727987, 0x424752);
  grid.position.set(2, -3.31, -1);
  grid.material.transparent = true;
  grid.material.opacity = 0.24;
  scene.add(grid);
  // Soft platinum dust adds depth without competing with the workstation.
  const particleCanvas = document.createElement("canvas");
  particleCanvas.width = 64;
  particleCanvas.height = 64;
  const particleContext = particleCanvas.getContext("2d");
  const particleGlow = particleContext.createRadialGradient(
    32,
    32,
    0,
    32,
    32,
    32,
  );
  particleGlow.addColorStop(0, "#ffffff");
  particleGlow.addColorStop(0.25, "#d9dce4cc");
  particleGlow.addColorStop(1, "#d9dce400");
  particleContext.fillStyle = particleGlow;
  particleContext.fillRect(0, 0, 64, 64);
  const particleTexture = new THREE.CanvasTexture(particleCanvas);
  const particlePositions = new Float32Array(120 * 3);
  for (let index = 0; index < 120; index++) {
    const offset = index * 3;
    particlePositions[offset] = ((index * 47) % 180) / 10 - 7;
    particlePositions[offset + 1] = ((index * 71) % 100) / 10 - 4;
    particlePositions[offset + 2] = -1.5 - ((index * 29) % 70) / 10;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3),
  );
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xe4e7ee,
    map: particleTexture,
    size: 0.13,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
  // Radial keyboard light.
  const lightCanvas = document.createElement("canvas");
  lightCanvas.width = 128;
  lightCanvas.height = 128;
  const lightContext = lightCanvas.getContext("2d");
  const gradient = lightContext.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "#87878766");
  gradient.addColorStop(1, "#87878700");
  lightContext.fillStyle = gradient;
  lightContext.fillRect(0, 0, 128, 128);
  const lightTexture = new THREE.CanvasTexture(lightCanvas);
  const lightPool = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 7),
    new THREE.MeshBasicMaterial({
      map: lightTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  lightPool.rotation.x = -Math.PI / 2;
  lightPool.position.set(2, -3.3, 1);
  scene.add(lightPool);
  const screen = new CSS3DObject(terminal);
  screen.position.set(computer.position.x, computer.position.y + 0.24, 0.225);
  screen.scale.setScalar(0.005);
  htmlScene.add(screen);
  const start = new THREE.Vector3(0, 1.2, 13.7);
  const end = new THREE.Vector3();
  const target = new THREE.Vector3();
  let width = 0,
    height = 0,
    frame = 0,
    disposed = false,
    lastFrame = 0;
  const pointer = new THREE.Vector2();
  const rotation = new THREE.Vector2();
  const restingPointer = new THREE.Vector2();
  let lastKey = null,
    keyRelease = 0;
  const screenLocal = new THREE.Vector3(0, 0.24, 0.225);
  const intro = document.querySelector(".intro");
  const details = [
    ...document.querySelectorAll(
      ".scene-annotation,.scene-bottom,.background-type",
    ),
  ];
  function draw(time = 0) {
    frame = 0;
    if (disposed || document.hidden) return;
    if (time - lastFrame < 15) {
      frame = requestAnimationFrame(draw);
      return;
    }
    lastFrame = time;
    const journey = document.querySelector(".journey");
    const progress = Math.min(
      1,
      Math.max(0, scrollY / (journey.offsetHeight - innerHeight)),
    );
    const t = progress * progress * (3 - 2 * progress);
    const interacting =
      terminal.contains(document.activeElement) ||
      terminal.matches(":hover") ||
      progress > 0.04;
    rotation.lerp(interacting ? restingPointer : pointer, 0.16);
    if (progress > 0.04) rotation.set(0, 0);
    if (lastKey && time > keyRelease) {
      lastKey.position.y = THREE.MathUtils.lerp(
        lastKey.position.y,
        -2.515,
        0.3,
      );
      if (Math.abs(lastKey.position.y + 2.515) < 0.001) lastKey = null;
    }
    lightPool.material.opacity = 0.8 + Math.sin(time * 0.0008) * 0.12;
    particles.rotation.y = time * 0.000025;
    particles.position.y = Math.sin(time * 0.00022) * 0.12;
    const lightSweep = Math.sin(time * 0.00015) * 0.7;
    if (!interacting) {
      key.position.x = -3 + lightSweep;
      fill.position.z = -1 + lightSweep * 0.4;
    }
    computer.rotation.y = (-0.16 + rotation.x * 0.3) * (1 - t);
    computer.rotation.x = rotation.y * 0.14 * (1 - t);
    computer.position.y = -0.55;
    mouse.position.y = -2.54 + Math.sin(time * 0.0006) * 0.012 * (1 - t);
    computer.updateMatrixWorld(true);
    screen.position.copy(screenLocal);
    computer.localToWorld(screen.position);
    computer.getWorldQuaternion(screen.quaternion);
    const availableHeight = Math.max(220, height - 260);
    const fitHeight = Math.max(
      3.0 / (availableHeight / height),
      5 / (Math.min(width - 120, 1200) / width) / (width / height),
    );
    const distance =
      fitHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    end.set(
      screen.position.x,
      screen.position.y - 0.12,
      screen.position.z + distance,
    );
    camera.position.lerpVectors(start, end, t);
    camera.position.x += Math.sin(t * Math.PI) * 0.45;
    camera.position.y += Math.sin(t * Math.PI) * 0.25;
    target.set(0, 0, 0).lerp(screen.position, t);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    intro.style.opacity = String(1 - Math.min(progress * 3, 1));
    intro.style.visibility = progress > 0.34 ? "hidden" : "";
    details.forEach((element) => {
      element.style.opacity = String(1 - Math.min(progress * 2, 1));
      element.style.visibility = progress > 0.5 ? "hidden" : "";
    });
    renderer.render(scene, camera);
    htmlRenderer.render(htmlScene, camera);
    if ((progress < 1 && scrollY < journey.offsetHeight) || lastKey)
      frame = requestAnimationFrame(draw);
  }
  function requestDraw() {
    if (!frame && !disposed) frame = requestAnimationFrame(draw);
  }
  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    renderer.setSize(width, height);
    htmlRenderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestDraw();
  }
  function contextLost(event) {
    event.preventDefault();
    document.body.classList.add("simple-mode");
    dispose();
    layer.append(terminal);
  }
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  function movePointer(event) {
    pointer.set(
      (event.clientX / innerWidth) * 2 - 1,
      (event.clientY / innerHeight) * 2 - 1,
    );
    requestDraw();
  }
  function changePower(event) {
    const on = event.detail.on;
    screenLight.intensity = on ? 5 : 0;
    glowMaterial.emissiveIntensity = on ? 2 : 0;
    glowMaterial.color.setHex(on ? 0xaaaaaa : 0x141414);
    lightPool.visible = on;
    back.intensity = on ? 18 : 0;
    fill.intensity = on ? 3 : 0.35;
    scene.environmentIntensity = on ? 0.95 : 0.12;
    key.intensity = on ? 3 : 0.7;
    ambient.intensity = on ? 1.6 : 0.8;
    terminal.dataset.reflections = on ? "on" : "off";
    particleMaterial.opacity = on ? 0.42 : 0.12;
    requestDraw();
  }
  function pressPhysicalKey(event) {
    if (
      event.target.id !== "command-input" ||
      event.ctrlKey ||
      event.metaKey ||
      event.key.length !== 1
    )
      return;
    if (lastKey) lastKey.position.y = -2.515;
    lastKey = keyCaps[event.key.toLowerCase().charCodeAt(0) % keyCaps.length];
    lastKey.position.y = -2.555;
    keyRelease = performance.now() + 100;
    requestDraw();
  }
  document.addEventListener("keydown", pressPhysicalKey);
  window.addEventListener("pointermove", movePointer, { passive: true });
  document.addEventListener("monitorpower", changePower);
  changePower({ detail: { on: !terminal.classList.contains("powered-off") } });
  window.addEventListener("scroll", requestDraw, { passive: true });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", requestDraw);
  resize();
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", requestDraw);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", requestDraw);
    document.removeEventListener("keydown", pressPhysicalKey);
    window.removeEventListener("pointermove", movePointer);
    document.removeEventListener("monitorpower", changePower);
    const materials = new Set();
    scene.traverse((object) => {
      object.geometry?.dispose();
      if (object.material) materials.add(object.material);
    });
    materials.forEach((material) => material.dispose());
    keyTexture.dispose();
    lightTexture.dispose();
    particleTexture.dispose();
    environment.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    layer.append(terminal);
    htmlRenderer.domElement.remove();
    terminal.style.transform = "";
    terminal.style.position = "";
    terminal.style.left = "";
    terminal.style.top = "";
    intro.style.opacity = "";
    intro.style.visibility = "";
    details.forEach((element) => {
      element.style.opacity = "";
      element.style.visibility = "";
    });
  }
  return { dispose };
}
