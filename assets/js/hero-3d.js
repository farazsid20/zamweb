let THREE;
try {
  THREE = await import('three');
} catch (_) {
  // The HTML and CSS hero artwork remains available when the optional CDN is unreachable.
}

const canvas = document.querySelector('#hero-canvas');
const stage = canvas?.closest('.hero-visual');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const compactDevice = matchMedia('(max-width: 780px)').matches || matchMedia('(pointer: coarse)').matches;

if (THREE && canvas && stage && !compactDevice) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
    camera.position.set(0, 0, 8.5);

    scene.add(new THREE.AmbientLight(0x8899ff, 1.35));
    const cyanLight = new THREE.PointLight(0x50e8dc, 18, 12);
    cyanLight.position.set(-3, 2, 4);
    scene.add(cyanLight);
    const violetLight = new THREE.PointLight(0xe477f5, 16, 12);
    violetLight.position.set(3, -1, 3);
    scene.add(violetLight);

    const artwork = new THREE.Group();
    scene.add(artwork);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.18, 2),
      new THREE.MeshStandardMaterial({ color: 0x6876ec, metalness: 0.72, roughness: 0.22, emissive: 0x201f5b, emissiveIntensity: 0.42, flatShading: true })
    );
    artwork.add(core);

    const wireframe = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.24, 1),
      new THREE.MeshBasicMaterial({ color: 0x8ddff0, wireframe: true, transparent: true, opacity: 0.28 })
    );
    artwork.add(wireframe);

    const orbitA = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.012, 5, 110),
      new THREE.MeshBasicMaterial({ color: 0x63e2db, transparent: true, opacity: 0.72 })
    );
    orbitA.rotation.set(1.08, 0.36, -0.24);
    artwork.add(orbitA);

    const orbitB = new THREE.Mesh(
      new THREE.TorusGeometry(2.04, 0.009, 5, 110),
      new THREE.MeshBasicMaterial({ color: 0xd77be9, transparent: true, opacity: 0.54 })
    );
    orbitB.rotation.set(0.32, 1.18, 0.44);
    artwork.add(orbitB);

    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffbb85 })
    );
    bead.position.set(1.55, 0.8, 0.25);
    artwork.add(bead);

    const particleCount = 90;
    const points = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const radius = 2.4 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3.6;
      points[i * 3] = Math.cos(theta) * radius;
      points[i * 3 + 1] = y;
      points[i * 3 + 2] = Math.sin(theta) * radius * 0.45;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0x9db9ff, size: 0.018, transparent: true, opacity: 0.56, sizeAttenuation: true }));
    scene.add(particles);

    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = stage.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 950 ? 9.3 : 8.5;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resize();

    let pointerX = 0;
    let pointerY = 0;
    stage.addEventListener('pointermove', (event) => {
      const rect = stage.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.34;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.24;
    }, { passive: true });
    stage.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; }, { passive: true });

    let visible = true;
    let pageVisible = !document.hidden;
    let frame = 0;
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && pageVisible && !reduceMotion) start();
      else stop();
    }, { threshold: 0.02 });
    observer.observe(stage);
    document.addEventListener('visibilitychange', () => {
      pageVisible = !document.hidden;
      if (visible && pageVisible && !reduceMotion) start();
      else stop();
    });

    const render = (time = 0) => {
      const seconds = time * 0.001;
      artwork.rotation.y += (pointerX + Math.sin(seconds * 0.28) * 0.09 - artwork.rotation.y) * 0.018;
      artwork.rotation.x += (pointerY + Math.sin(seconds * 0.22) * 0.04 - artwork.rotation.x) * 0.018;
      core.rotation.y = seconds * 0.12;
      core.rotation.x = Math.sin(seconds * 0.19) * 0.1;
      wireframe.rotation.y = -seconds * 0.08;
      orbitA.rotation.z = -0.24 + seconds * 0.035;
      orbitB.rotation.y = 1.18 + Math.sin(seconds * 0.18) * 0.08;
      particles.rotation.y = seconds * 0.012;
      renderer.render(scene, camera);
      if (!reduceMotion && visible && pageVisible) frame = requestAnimationFrame(render);
    };
    function start() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    if (reduceMotion) render(0);
    else if (visible && pageVisible) start();
  } catch (error) {
    // The CSS glass artwork remains visible if WebGL is unavailable.
    canvas.hidden = true;
  }
}
