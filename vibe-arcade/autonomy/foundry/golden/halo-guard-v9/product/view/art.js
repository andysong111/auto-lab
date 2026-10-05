import * as THREE from '../three.module.min.js';

const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function mesh(parent, geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) {
  const value = new THREE.Mesh(geometry, material);
  value.position.set(...position);
  value.scale.set(...scale);
  value.castShadow = true;
  value.receiveShadow = true;
  parent.add(value);
  return value;
}

function sphere(parent, radius, material, position, scale) {
  return mesh(parent, new THREE.SphereGeometry(radius, 24, 16), material, position, scale);
}

function capsule(parent, radius, length, material, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const value = mesh(parent, new THREE.CapsuleGeometry(radius, length, 6, 12), material, position, scale);
  value.rotation.set(...rotation);
  return value;
}

function cone(parent, radius, height, material, position, rotation = [0, 0, 0]) {
  const value = mesh(parent, new THREE.ConeGeometry(radius, height, 5), material, position);
  value.rotation.set(...rotation);
  return value;
}

function createMaterials() {
  return {
    white: new THREE.MeshStandardMaterial({color: 0xf7fbff, roughness: .28, metalness: .18}),
    mint: new THREE.MeshStandardMaterial({color: 0x55e2a6, roughness: .3, metalness: .2, emissive: 0x0c553c, emissiveIntensity: .45}),
    cyan: new THREE.MeshStandardMaterial({color: 0x31dff0, roughness: .18, metalness: .22, emissive: 0x0a9fb0, emissiveIntensity: 1.7}),
    gold: new THREE.MeshStandardMaterial({color: 0xffcf54, roughness: .26, metalness: .55, emissive: 0x8b5900, emissiveIntensity: .55}),
    dark: new THREE.MeshStandardMaterial({color: 0x101a25, roughness: .32, metalness: .55}),
    red: new THREE.MeshStandardMaterial({color: 0xef3950, roughness: .28, metalness: .5, emissive: 0x65000d, emissiveIntensity: .65}),
    coral: new THREE.MeshStandardMaterial({color: 0xff706f, roughness: .2, metalness: .24, emissive: 0xb51a22, emissiveIntensity: 1.5}),
    stone: new THREE.MeshStandardMaterial({color: 0x203b59, roughness: .72, metalness: .08, transparent: true, opacity: .72}),
    grass: new THREE.MeshStandardMaterial({color: 0x2d7277, roughness: .68, metalness: .04, emissive: 0x092c32, emissiveIntensity: .18, transparent: true, opacity: .7}),
    cloud: new THREE.MeshStandardMaterial({color: 0xdff8ff, roughness: .82, metalness: 0, transparent: true, opacity: .38})
  };
}

function createGuardian(materials) {
  const group = new THREE.Group();
  sphere(group, .92, materials.white, [0, 0, 0], [1, .88, .82]);
  sphere(group, .62, materials.dark, [0, -.12, .55], [1, .88, .38]);
  sphere(group, .22, materials.cyan, [-.28, .05, .82], [1, .78, .34]);
  sphere(group, .22, materials.cyan, [.28, .05, .82], [1, .78, .34]);
  capsule(group, .18, .55, materials.mint, [-.92, -.04, .02], [0, 0, .45]);
  capsule(group, .18, .55, materials.mint, [.92, -.04, .02], [0, 0, -.45]);
  sphere(group, .3, materials.gold, [0, -.64, .42], [1.1, .72, .42]);
  group.scale.setScalar(.85);
  return group;
}

function createWisp(materials) {
  const group = new THREE.Group();
  sphere(group, .55, materials.white, [0, 0, 0], [1.12, .86, .82]);
  sphere(group, .16, materials.dark, [-.22, .09, .45], [.8, 1, .45]);
  sphere(group, .16, materials.dark, [.22, .09, .45], [.8, 1, .45]);
  sphere(group, .08, materials.cyan, [-.2, .1, .53]);
  sphere(group, .08, materials.cyan, [.2, .1, .53]);
  sphere(group, .42, materials.mint, [-.46, .33, -.08], [.36, 1.15, .2]);
  sphere(group, .42, materials.mint, [.46, .33, -.08], [.36, 1.15, .2]);
  for (let index = 0; index < 3; index++) sphere(group, .18 - index * .025, materials.cyan, [-.72 - index * .25, -.04 - index * .05, -.18], [1.35, .62, .45]);
  group.scale.setScalar(.72);
  return group;
}

function createRaider(materials) {
  const group = new THREE.Group();
  mesh(group, new THREE.DodecahedronGeometry(.72, 1), materials.red, [0, 0, 0], [1.18, .9, .72]);
  sphere(group, .38, materials.dark, [0, -.02, .56], [1, .86, .35]);
  sphere(group, .2, materials.coral, [0, -.02, .78], [1.2, 1, .3]);
  cone(group, .28, .9, materials.dark, [-.55, .58, -.06], [0, 0, -.62]);
  cone(group, .28, .9, materials.dark, [.55, .58, -.06], [0, 0, .62]);
  capsule(group, .18, .48, materials.red, [-.74, -.48, 0], [0, 0, .7]);
  capsule(group, .18, .48, materials.red, [.74, -.48, 0], [0, 0, -.7]);
  for (const side of [-1, 1]) {
    cone(group, .13, .4, materials.coral, [side * .92, -.76, .2], [0, 0, side * .24]);
    cone(group, .13, .4, materials.coral, [side * .66, -.84, .2], [0, 0, -side * .22]);
  }
  group.scale.setScalar(.68);
  return group;
}

function createCloud(materials, x, y, z, scale = 1) {
  const cloud = new THREE.Group();
  sphere(cloud, .72, materials.cloud, [-.7, 0, 0], [1.25, .72, .7]);
  sphere(cloud, .9, materials.cloud, [0, .18, 0], [1.35, .78, .72]);
  sphere(cloud, .62, materials.cloud, [.82, -.02, 0], [1.25, .68, .65]);
  cloud.position.set(x, y, z);
  cloud.scale.setScalar(scale);
  return cloud;
}

async function loadTexture(renderer, url) {
  const texture = await new THREE.TextureLoader().loadAsync(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

export async function createHaloGuardView({canvas}) {
  if (!canvas) throw new Error('halo_guard_canvas_missing');
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101a31);
  scene.fog = new THREE.Fog(0x101a31, 18, 30);
  const camera = new THREE.PerspectiveCamera(42, 1.6, .1, 100);
  camera.position.set(0, 0, 16);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xc8fbff, 0x071019, 2.2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
  keyLight.position.set(-5, 7, 10);
  keyLight.castShadow = true;
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0x35f0bf, 16, 20);
  rimLight.position.set(5, -3, 7);
  scene.add(rimLight);

  const backgroundTexture = await loadTexture(renderer, '../halo-sky-citadel-bg-v2.png');
  const background = new THREE.Mesh(new THREE.PlaneGeometry(35, 23.33), new THREE.MeshBasicMaterial({map: backgroundTexture, fog: false, depthWrite: false, depthTest: false}));
  background.position.z = -12;
  background.renderOrder = -10;
  scene.add(background);

  const materials = createMaterials();
  const world = new THREE.Group();
  scene.add(world);
  const phaseMaterial = new THREE.MeshBasicMaterial({color: 0x0f5670, transparent: true, opacity: .14, depthWrite: false, depthTest: false});
  const phaseWash = new THREE.Mesh(new THREE.CircleGeometry(5.7, 64), phaseMaterial);
  phaseWash.position.z = -1.3;
  phaseWash.renderOrder = -2;
  world.add(phaseWash);
  const environment = new THREE.Group();
  const courtyard = mesh(environment, new THREE.CylinderGeometry(4.12, 4.2, .16, 64), materials.stone, [0, 0, -1.75]);
  courtyard.rotation.x = Math.PI / 2;
  const lawn = mesh(environment, new THREE.CylinderGeometry(3.32, 3.32, .045, 64), materials.grass, [0, 0, -1.4]);
  lawn.rotation.x = Math.PI / 2;
  mesh(environment, new THREE.TorusGeometry(4.08, .032, 12, 96), materials.gold, [0, 0, -1.25]);
  const clouds = [createCloud(materials, -6.6, -3.9, -3.2, .68), createCloud(materials, 6.45, -3.75, -3.35, .6), createCloud(materials, 0, -5.05, -3.6, .82)];
  clouds.forEach(cloud => environment.add(cloud));
  world.add(environment);

  const ringMaterial = new THREE.MeshStandardMaterial({color: 0x1b4c5c, emissive: 0x0b2934, emissiveIntensity: .8, roughness: .45});
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(3.92, .055, 8, 96), ringMaterial);
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(2.25, .035, 8, 72), ringMaterial);
  innerRing.position.z = -.4;
  world.add(baseRing, innerRing);
  const guardian = createGuardian(materials);
  guardian.position.z = .1;
  world.add(guardian);
  const coreAuraMaterial = new THREE.MeshBasicMaterial({color: 0x69f4ff, transparent: true, opacity: .5, depthWrite: false, depthTest: false});
  const coreAura = new THREE.Mesh(new THREE.CircleGeometry(1.38, 48), coreAuraMaterial);
  coreAura.position.z = -.05;
  coreAura.renderOrder = 1;
  world.add(coreAura);
  const shieldMaterial = new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0x35dca8, emissiveIntensity: 2.1, roughness: .18, metalness: .2});
  const shield = new THREE.Mesh(new THREE.TorusGeometry(3.92, .3, 14, 48, 1.08), shieldMaterial);
  shield.position.z = .25;
  shield.castShadow = true;
  world.add(shield);

  const dangerBeacon = new THREE.Group();
  const dangerPlate = mesh(dangerBeacon, new THREE.CircleGeometry(.94, 36), new THREE.MeshBasicMaterial({color: 0xfff4e9, transparent: true, opacity: 1, depthWrite: false}), [0, 0, -.08]);
  dangerPlate.renderOrder = 2;
  const dangerHalo = mesh(dangerBeacon, new THREE.TorusGeometry(.62, .13, 12, 32), materials.coral, [0, 0, 0]);
  dangerHalo.rotation.z = .22;
  sphere(dangerBeacon, .35, materials.red, [0, 0, .12], [1.1, .86, .5]);
  sphere(dangerBeacon, .11, materials.white, [-.13, .03, .38], [1, .75, .35]);
  sphere(dangerBeacon, .11, materials.white, [.13, .03, .38], [1, .75, .35]);
  dangerBeacon.position.set(4.55, 3.18, .28);
  dangerBeacon.scale.setScalar(.72);
  world.add(dangerBeacon);

  const feedbackMaterial = new THREE.MeshBasicMaterial({color: 0x5ce0a1, transparent: true, opacity: 0, side: THREE.DoubleSide, depthTest: false, depthWrite: false});
  const feedbackRing = new THREE.Mesh(new THREE.RingGeometry(.45, .95, 40), feedbackMaterial);
  feedbackRing.position.z = 1.2;
  feedbackRing.renderOrder = 20;
  world.add(feedbackRing);
  const feedbackWashMaterial = new THREE.MeshBasicMaterial({color: 0x31dff0, transparent: true, opacity: 0, depthTest: false, depthWrite: false});
  const feedbackWash = new THREE.Mesh(new THREE.CircleGeometry(5.75, 64), feedbackWashMaterial);
  feedbackWash.position.z = 1.05;
  feedbackWash.renderOrder = 18;
  world.add(feedbackWash);
  const resultMaterial = new THREE.MeshBasicMaterial({color: 0x0b5f45, transparent: true, opacity: 0, depthTest: false});
  const resultPlane = new THREE.Mesh(new THREE.PlaneGeometry(13.5, 8), resultMaterial);
  resultPlane.position.z = 2;
  resultPlane.renderOrder = 30;
  world.add(resultPlane);

  const stars = [];
  for (let index = 0; index < 150; index++) {
    const angle = index * 2.399963, radius = 2 + (index % 17) * .55;
    stars.push(Math.cos(angle) * radius, Math.sin(angle) * radius * .62, -3 - (index % 13) * .55);
  }
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
  scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({color: 0x6da7ba, size: .04})));

  const visuals = new Map();
  const FEEDBACK_FRAMES = 13;
  let disposed = false, latest = null, reducedMotion = false, feedbackFrames = 0, feedbackAngle = Math.PI / 2;
  let lastMeaningful = null, lastProgress = 0, lastDamage = '4:2';

  function syncItems(state) {
    const live = new Set();
    for (const item of state.items || []) {
      live.add(item.id);
      if (!visuals.has(item.id)) {
        const model = item.bad ? createRaider(materials) : createWisp(materials);
        model.position.z = .45;
        world.add(model);
        visuals.set(item.id, model);
      }
    }
    for (const [id, model] of visuals) if (!live.has(id)) {
      world.remove(model);
      visuals.delete(id);
    }
  }

  function render(snapshot) {
    if (disposed) return;
    latest = snapshot;
    const state = snapshot.state || {}, quality = snapshot.quality || {}, now = performance.now();
    reducedMotion = !!snapshot.presentation?.platform_reduced_motion;
    const meaningful = Number(quality.meaningful_actions) || 0;
    const progress = Number(state.caught) || 0;
    const damage = `${state.lives}:${state.barrier}`;
    if ((lastMeaningful !== null && meaningful !== lastMeaningful) || progress !== lastProgress || damage !== lastDamage) {
      feedbackFrames = FEEDBACK_FRAMES;
      feedbackAngle = Number(state.targetAngle) || Number(state.angle) || 0;
    }
    lastMeaningful = meaningful;
    lastProgress = progress;
    lastDamage = damage;
    syncItems(state);

    const phase = clamp(Number(state.phase) || 1, 1, 3);
    scene.background.setHex(phase === 1 ? 0x101a31 : phase === 2 ? 0x162849 : 0x321c42);
    scene.fog.color.copy(scene.background);
    phaseMaterial.color.setHex(phase === 1 ? 0x0f5670 : phase === 2 ? 0x5130a3 : 0xd51f55);
    phaseMaterial.opacity = phase === 1 ? .06 : phase === 2 ? .5 : .68;
    rimLight.intensity = 14 + phase * 3;
    baseRing.rotation.z = now * .0001;
    innerRing.rotation.z = -now * .00018;
    guardian.position.y = (reducedMotion ? 0 : Math.sin(now * .0022) * .08) - (Number(state.guardianKick) || 0) * .18;
    guardian.rotation.y = reducedMotion ? 0 : Math.sin(now * .0014) * .12;
    guardian.scale.setScalar(.85 + (Number(state.guardianKick) || 0) * .1);
    coreAuraMaterial.opacity = .48 + phase * .07;
    coreAura.scale.setScalar(reducedMotion ? 1 : 1 + Math.sin(now * .003) * .045);
    dangerBeacon.rotation.z = reducedMotion ? 0 : Math.sin(now * .0018) * .08;
    dangerBeacon.scale.setScalar(.72 + (reducedMotion ? 0 : Math.sin(now * .004) * .035));
    shield.rotation.z = (Number(state.angle) || 0) - .525;
    shieldMaterial.color.setHex(Number(state.overdrive) > 0 ? 0xffd166 : 0xffffff);
    shieldMaterial.emissive.setHex(Number(state.overdrive) > 0 ? 0xc67900 : 0x35dca8);
    shield.scale.setScalar(Number(state.overdrive) > 0 ? 1.08 : 1);
    if (!reducedMotion) {
      background.position.x = Math.sin(now * .00007) * .18;
      background.position.y = Math.cos(now * .000055) * .08;
      background.rotation.z = Math.sin(now * .000035) * .0015;
      clouds.forEach((cloud, index) => { cloud.position.y = -3.9 - index * .05 + Math.sin(now * (.00012 + index * .000025)) * .18; });
    }
    for (const item of state.items || []) {
      const model = visuals.get(item.id);
      if (!model) continue;
      const angle = Number(item.currentAngle) || 0;
      model.position.set(Math.cos(angle) * item.r, Math.sin(angle) * item.r, .4 + (reducedMotion ? 0 : Math.sin(item.pulse) * .28));
      model.rotation.z = angle - Math.PI / 2;
      if (!reducedMotion) model.rotation.y += item.bad ? .045 : .028;
      const pulse = 1 + (reducedMotion ? 0 : Math.sin(item.pulse) * .06);
      model.scale.setScalar(pulse);
    }

    const feedbackActive = feedbackFrames > 0;
    if (feedbackActive) {
      const t = reducedMotion ? 1 : clamp((FEEDBACK_FRAMES - feedbackFrames) / FEEDBACK_FRAMES, 0, 1), radius = 3.92;
      feedbackRing.visible = true;
      feedbackRing.position.set(Math.cos(feedbackAngle) * radius, Math.sin(feedbackAngle) * radius, 1.2);
      feedbackRing.scale.setScalar(reducedMotion ? 1.2 : .7 + t * 1.5);
      feedbackMaterial.opacity = reducedMotion ? .92 : .85 * (1 - t);
      feedbackMaterial.color.setHex(damage !== '4:2' ? 0xff4e65 : progress > 0 ? 0x5ce0a1 : 0x31dff0);
      feedbackWash.visible = true;
      feedbackWashMaterial.opacity = reducedMotion ? .62 : .72 * (1 - t * .55);
      feedbackWashMaterial.color.copy(feedbackMaterial.color);
      shieldMaterial.emissiveIntensity = reducedMotion ? 4 : 4 - t * 1.4;
    } else {
      feedbackRing.visible = false;
      feedbackMaterial.opacity = 0;
      feedbackWash.visible = false;
      feedbackWashMaterial.opacity = 0;
      shieldMaterial.emissiveIntensity = 2.1;
    }

    const outcome = state.outcome;
    resultPlane.visible = outcome === 'success' || outcome === 'failure';
    resultMaterial.color.setHex(outcome === 'success' ? 0x0b5f45 : 0x7a1830);
    resultMaterial.opacity = resultPlane.visible ? .52 : 0;
    renderer.render(scene, camera);
    if (feedbackFrames > 0) feedbackFrames -= 1;
  }

  function resize(width, height) {
    if (disposed) return;
    renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    camera.aspect = Math.max(1, width) / Math.max(1, height);
    camera.updateProjectionMatrix();
  }

  function presentation() {
    const active = feedbackFrames > 0;
    return {
      reduced_motion: reducedMotion,
      feedback_active: active,
      static_feedback: reducedMotion && active,
      protected_motion: active,
      protected_progress: Number(latest?.progress) || 0,
      protected_result: ['success', 'failure'].includes(latest?.state?.outcome)
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    renderer.dispose();
    backgroundTexture.dispose();
  }

  return Object.freeze({render, resize, dispose, presentation, kind: 'three-webgl', version: 'halo-guard-v9-product-1'});
}
