import * as THREE from 'three';
import {
  createFrontCoverTexture,
  createSpineTexture,
  createBackCoverTexture,
  createPaperEdgeTexture
} from './bookTextures';

export class BookshelfEngine {
  constructor(canvas, booksData, callbacks) {
    this.canvas = canvas;
    this.booksData = booksData;
    this.callbacks = callbacks; // { onModeChange }

    this.mode = 'browse'; // 'browse' | 'focusing' | 'inspect' | 'returning'
    this.selectedIndex = null;
    this.hoveredIndex = null;

    this.scrollX = 0;
    this.targetScrollX = 0;

    // Pointer & Orbit Drag State
    this.pointer = new THREE.Vector2(-100, -100);
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartScrollX = 0;
    this.orbitRotY = -0.15;

    this.raycaster = new THREE.Raycaster();
    this.bookMeshes = [];
    this.isDisposed = false;

    this.initThree();
    this.setupScene();
    this.createBooks();
    this.bindEvents();
    this.animate();
  }

  initThree() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#141416');
    this.scene.fog = new THREE.FogExp2('#141416', 0.03);

    this.camera = new THREE.PerspectiveCamera(27, 1, 0.1, 50);
    this.browseCamPos = new THREE.Vector3(0, 1.42, 6.65);
    this.browseCamTarget = new THREE.Vector3(0, 1.28, 0.15);

    this.camera.position.copy(this.browseCamPos);
    this.camera.lookAt(this.browseCamTarget);

    this.handleResize();
  }

  setupScene() {
    // Hemisphere fill light
    const hemiLight = new THREE.HemisphereLight('#fff8ea', '#141416', 2.0);
    this.scene.add(hemiLight);

    // Primary Directional Key Light with Soft Shadows
    this.keyLight = new THREE.DirectionalLight('#fff6e7', 3.6);
    this.keyLight.position.set(-4.2, 7.4, 5.5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.bias = -0.0003;
    this.scene.add(this.keyLight);

    // Warm Foil Accent Rim Light
    const rimLight = new THREE.PointLight('#d4af37', 2.0, 12, 2);
    rimLight.position.set(4.5, 3.0, 3.0);
    this.scene.add(rimLight);

    // Backdrop Exhibition Wall
    const wallGeo = new THREE.PlaneGeometry(36, 18);
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#141416',
      roughness: 0.95,
      metalness: 0.05,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 5, -2.8);
    wall.receiveShadow = true;
    this.scene.add(wall);

    // Shelf Group
    this.shelfGroup = new THREE.Group();
    this.scene.add(this.shelfGroup);

    // Continuous Dark Mahogany Wooden Shelf
    const totalWidth = this.booksData.length * 1.0 + 8;
    const shelfGeo = new THREE.BoxGeometry(totalWidth, 0.22, 1.72);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: '#281e18',
      roughness: 0.5,
      metalness: 0.05,
    });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, 0.2, 0);
    shelf.receiveShadow = true;
    shelf.castShadow = true;
    this.shelfGroup.add(shelf);
  }

  createBooks() {
    const bookWidth = 0.62;
    const bookHeight = 1.6;
    const paperEdgeTex = createPaperEdgeTexture();

    const startX = -((this.booksData.length - 1) * 0.85) / 2;

    this.booksData.forEach((data, index) => {
      const thickness = data.thickness || 0.4;
      const xPos = startX + index * 0.85;

      const bookGroup = new THREE.Group();
      bookGroup.position.set(xPos, 0.31 + bookHeight / 2, 0);

      // Create Cover & Spine Textures
      const frontTex = createFrontCoverTexture(data);
      const spineTex = createSpineTexture(data);
      const backTex = createBackCoverTexture(data);

      const coverMatProps = {
        roughness: 0.38,
        metalness: 0.15,
      };

      // Materials Array: [Right (+X), Left (-X), Top (+Y), Bottom (-Y), Front (+Z), Back (-Z)]
      const materials = [
        new THREE.MeshStandardMaterial({ map: paperEdgeTex, roughness: 0.9 }), // Right (Pages)
        new THREE.MeshStandardMaterial({ map: spineTex, ...coverMatProps }),     // Left (Spine)
        new THREE.MeshStandardMaterial({ map: paperEdgeTex, roughness: 0.9 }), // Top (Pages)
        new THREE.MeshStandardMaterial({ map: paperEdgeTex, roughness: 0.9 }), // Bottom (Pages)
        new THREE.MeshStandardMaterial({ map: frontTex, ...coverMatProps }),    // Front (Cover)
        new THREE.MeshStandardMaterial({ map: backTex, ...coverMatProps }),     // Back (Cover)
      ];

      // Single Clean BoxGeometry Mesh (NO EXTERNAL CYLINDERS)
      const bookGeo = new THREE.BoxGeometry(bookWidth, bookHeight, thickness);
      const bookMesh = new THREE.Mesh(bookGeo, materials);
      bookMesh.castShadow = true;
      bookMesh.receiveShadow = true;

      // Shelved Orientation: Spine facing viewer (-X rotated to +Z)
      bookMesh.rotation.y = Math.PI / 2;

      bookGroup.add(bookMesh);
      this.shelfGroup.add(bookGroup);

      this.bookMeshes.push({
        group: bookGroup,
        mesh: bookMesh,
        data: data,
        index: index,
        baseX: xPos,
        baseY: 0.31 + bookHeight / 2,
        baseZ: 0,
        targetY: 0.31 + bookHeight / 2,
        targetZ: 0,
        targetRotX: 0,
        targetRotY: Math.PI / 2,
        targetRotZ: 0,
      });
    });
  }

  bindEvents() {
    this.onPointerDown = (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartScrollX = this.targetScrollX;
    };

    this.onPointerMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isDragging && this.mode === 'browse') {
        const deltaX = e.clientX - this.dragStartX;
        this.targetScrollX = this.dragStartScrollX - deltaX * 0.005;
        const maxScroll = (this.booksData.length - 1) * 0.425;
        this.targetScrollX = THREE.MathUtils.clamp(this.targetScrollX, -maxScroll, maxScroll);
      } else if (this.isDragging && this.mode === 'inspect') {
        // Orbit Inspection 3D Drag Rotation
        const deltaX = e.clientX - this.dragStartX;
        this.orbitRotY += deltaX * 0.008;
        this.dragStartX = e.clientX;
      }
    };

    this.onPointerUp = () => {
      this.isDragging = false;
    };

    this.onClick = (e) => {
      if (Math.abs(e.clientX - this.dragStartX) > 5) return; // Ignore drag clicks
      if (this.mode === 'browse' && this.hoveredIndex !== null) {
        this.selectBook(this.hoveredIndex);
      }
    };

    this.onWheel = (e) => {
      if (this.mode !== 'browse') return;
      this.targetScrollX += e.deltaY * 0.003;
      const maxScroll = (this.booksData.length - 1) * 0.425;
      this.targetScrollX = THREE.MathUtils.clamp(this.targetScrollX, -maxScroll, maxScroll);
    };

    this.onKeyDown = (e) => {
      if (e.key === 'Escape' && this.mode === 'inspect') {
        this.returnToShelf();
      } else if (e.key === 'ArrowRight' && this.mode === 'browse') {
        this.targetScrollX = Math.min(this.targetScrollX + 0.85, (this.booksData.length - 1) * 0.425);
      } else if (e.key === 'ArrowLeft' && this.mode === 'browse') {
        this.targetScrollX = Math.max(this.targetScrollX - 0.85, -(this.booksData.length - 1) * 0.425);
      }
    };

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('click', this.onClick);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: true });
    window.addEventListener('keydown', this.onKeyDown);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvas.parentElement || document.body);
  }

  selectBook(index) {
    this.mode = 'focusing';
    this.selectedIndex = index;
    this.orbitRotY = -0.15; // Face front cover towards viewer
    this.callbacks.onModeChange('inspect', index);

    const targetBook = this.bookMeshes[index];
    if (targetBook) {
      targetBook.targetZ = 2.0;
      targetBook.targetY = 1.25;
      targetBook.targetRotY = -0.15;
      targetBook.targetRotX = 0.05;
    }
  }

  returnToShelf() {
    this.mode = 'returning';
    if (this.selectedIndex !== null) {
      const book = this.bookMeshes[this.selectedIndex];
      if (book) {
        book.targetZ = book.baseZ;
        book.targetY = book.baseY;
        book.targetRotY = Math.PI / 2;
        book.targetRotX = 0;
        book.targetRotZ = 0;
      }
    }
    this.selectedIndex = null;
    this.callbacks.onModeChange('browse', null);
    setTimeout(() => {
      this.mode = 'browse';
    }, 500);
  }

  handleResize() {
    if (!this.canvas || !this.renderer) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = parent.clientHeight || 600;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    if (this.isDisposed) return;
    requestAnimationFrame(() => this.animate());

    // Damped Smooth Scroll
    this.scrollX = THREE.MathUtils.damp(this.scrollX, this.targetScrollX, 8, 0.016);
    this.shelfGroup.position.x = -this.scrollX;

    // Raycasting for Hover Detection (Browse mode)
    if (this.mode === 'browse') {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const meshesToIntersect = this.bookMeshes.map((b) => b.mesh);
      const intersects = this.raycaster.intersectObjects(meshesToIntersect);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const hitBook = this.bookMeshes.find((b) => b.mesh === hitMesh);
        if (hitBook) {
          this.hoveredIndex = hitBook.index;
          this.canvas.style.cursor = 'pointer';
        }
      } else {
        this.hoveredIndex = null;
        this.canvas.style.cursor = 'grab';
      }

      // Update Hover Transforms for shelved books
      this.bookMeshes.forEach((b) => {
        if (b.index === this.hoveredIndex) {
          b.targetZ = 0.32; // Slide forward
          b.targetRotY = Math.PI / 2 - 0.28; // Lean forward
        } else {
          b.targetZ = 0;
          b.targetRotY = Math.PI / 2;
        }
      });
    } else if (this.mode === 'inspect' && this.selectedIndex !== null) {
      // Apply 3D Orbit Drag Rotation in Inspect mode
      const selectedBook = this.bookMeshes[this.selectedIndex];
      if (selectedBook) {
        selectedBook.targetRotY = this.orbitRotY;
      }
    }

    // Interpolate Book Transformations with Smooth Damping
    this.bookMeshes.forEach((b) => {
      b.group.position.z = THREE.MathUtils.damp(b.group.position.z, b.targetZ, 10, 0.016);
      b.group.position.y = THREE.MathUtils.damp(b.group.position.y, b.targetY, 10, 0.016);
      b.group.rotation.y = THREE.MathUtils.damp(b.group.rotation.y, b.targetRotY, 10, 0.016);
      b.group.rotation.x = THREE.MathUtils.damp(b.group.rotation.x, b.targetRotX, 10, 0.016);
    });

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.isDisposed = true;
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    this.renderer.dispose();
  }
}
