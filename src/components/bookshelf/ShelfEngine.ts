import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { CatalogBook } from "./catalog";
import {
  getCarouselPose,
  shelvedBookPose,
  createMotionLayout,
  SLOT_SPACING,
  presentedZ,
  presentedScale,
  type BookPose,
  type MotionLayout,
} from "./book-motion";
import {
  createBackCover,
  createFrontCover,
  createSpineCover,
  createTitleDecal,
  createInsideCover,
  createFirstPage,
} from "./cover-art";
import { CREDENTIALS_CATALOG, type CredentialItem } from "./credentials";

export type ShelfMode = "browse" | "focusing" | "inspect" | "returning";

type ShelfCallbacks = {
  onActiveIndex: (index: number) => void;
  onMode: (mode: ShelfMode, selectedIndex: number | null) => void;
  onStatus: (message: string) => void;
  onReady: () => void;
  onNavToolChange?: (tool: "pan" | "orbit") => void;
  onSelectCertificate?: (cert: CredentialItem) => void;
  onHoverCertificate?: (cert: CredentialItem | null) => void;
};

type RuntimeCredential = {
  data: CredentialItem;
  group: THREE.Group;
  pickProxy: THREE.Mesh;
  hoverRingMat: THREE.MeshBasicMaterial;
  basePos: THREE.Vector3;
  hover: number;
  targetHover: number;
  externalHover: boolean;
  textures: THREE.Texture[];
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
};

type RuntimeBook = {
  data: CatalogBook;
  index: number;
  slot: THREE.Group;
  content: THREE.Group;
  inspectionIdle: THREE.Group;
  physical: THREE.Group;
  bodyMesh: THREE.Mesh;
  coverHinge: THREE.Group;
  coverMesh: THREE.Mesh;
  insideCoverMaterial: THREE.MeshStandardMaterial;
  firstPageMaterial: THREE.MeshStandardMaterial;
  spreadHydrated: boolean;
  titleDecal?: THREE.Mesh;
  pickProxy: THREE.Mesh;
  x: number;
  width: number;
  pose: BookPose;
  hover: number;
  targetHover: number;
  openProgress: number;
  textures: THREE.Texture[];
};

const shelfTop = 0.18;
const browseCamera = new THREE.Vector3(0, 1.36, 7.85);
const browseTarget = new THREE.Vector3(0, 1.28, 0.15);

const pageColor = new THREE.Color("#e9dfca");
const shelfColor = new THREE.Color("#5a4132");
const clamp = THREE.MathUtils.clamp;

function damp(current: number, target: number, lambda: number, delta: number) {
  return THREE.MathUtils.damp(current, target, lambda, delta);
}

function toTexture(
  canvas: HTMLCanvasElement,
  renderer: THREE.WebGLRenderer,
  anisotropy = 4,
) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(
    anisotropy,
    renderer.capabilities.getMaxAnisotropy(),
  );
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

export class ShelfEngine {
  private canvas: HTMLCanvasElement;
  private booksData: CatalogBook[];
  private callbacks: ShelfCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private shelfGroup = new THREE.Group();
  private shelfFurniture = new THREE.Group();
  private runtimeBooks: RuntimeBook[] = [];
  private pickTargets: THREE.Object3D[] = [];
  private runtimeCerts: RuntimeCredential[] = [];
  private certPickTargets: THREE.Object3D[] = [];
  private hoveredCertId: string | null = null;
  private galleryDisposables: Array<{ geometry?: THREE.BufferGeometry; material?: THREE.Material }> = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(10, 10);
  private animationFrame = 0;
  private resizeObserver: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private isIntersecting = true;
  private mode: ShelfMode = "browse";
  private selectedIndex: number | null = null;
  private activeIndex = 0;

  // Smooth Gliding Carousel State
  private currentScroll = 0;
  private targetScroll = 0;
  private dragStartScroll = 0;
  private pointerDown = false;
  private pointerStartX = 0;
  private pointerLastX = 0;
  private pointerLastTime = 0;
  private dragVelocity = 0;
  private pointerTravel = 0;
  private lastWheelTime = 0;
  private isAnimating = false;

  // Smooth Camera & Inspect Framing
  private responsiveBrowseCamera = browseCamera.clone();
  private responsiveBrowseTarget = browseTarget.clone();
  private currentCameraLookAt = browseTarget.clone();
  private targetCameraPos = browseCamera.clone();
  private targetCameraLookAt = browseTarget.clone();
  private targetInspectTarget = new THREE.Vector3();

  // Navigation & Viewport Tools
  private navTool: "pan" | "orbit" = "pan";
  private isDrawerOpen = true;
  private isResetting = false;
  private currentViewOffsetX = 0;
  private targetViewOffsetX = 0;
  private currentViewOffsetY = 0;
  private targetViewOffsetY = 0;

  private isCompactGpu(): boolean {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 780 || Boolean(window.matchMedia?.("(pointer: coarse)")?.matches);
  }

  private motionLayout: MotionLayout = createMotionLayout([]);
  private lastTimestamp = 0;
  private isDisposed = false;
  private framedPicturesGroup = new THREE.Group();

  constructor(
    canvas: HTMLCanvasElement,
    books: CatalogBook[],
    callbacks: ShelfCallbacks,
  ) {
    this.canvas = canvas;
    this.booksData = books;
    this.callbacks = callbacks;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.isCompactGpu(),
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, this.isCompactGpu() ? 1.25 : 1.5),
    );

    this.camera = new THREE.PerspectiveCamera(27, 1, 0.08, 60);
    this.camera.position.copy(browseCamera);
    this.camera.lookAt(browseTarget);

    // OrbitControls for 3D Book Inspection & Viewport Navigation
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enabled = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;
    this.controls.enableZoom = true;
    this.controls.minDistance = 1.0;
    this.controls.maxDistance = 8.5;
    this.controls.minPolarAngle = Math.PI * 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.92;

    // Default to Pan / Move mode as requested by user
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    this.controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    // Wake render loop whenever user drags OrbitControls
    this.controls.addEventListener("change", this.handleControlsChange);
    this.controls.addEventListener("start", this.handleControlsStart);
    this.controls.addEventListener("end", this.handleControlsEnd);

    this.resizeObserver = new ResizeObserver(this.handleResize);
    if (typeof IntersectionObserver !== "undefined") {
      this.intersectionObserver = new IntersectionObserver(this.handleIntersection, {
        threshold: 0,
      });
      this.intersectionObserver.observe(canvas);
    }
    this.setupScene();
    this.createBooks();
    this.bindEvents();
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.handleResize();
    this.callbacks.onReady();
    this.callbacks.onStatus(`${this.booksData.length} volumes ready`);
    this.requestRender();
  }

  private setupScene() {
    // Harmonized Chalk-inspired warm gallery studio backdrop
    const galleryBg = "#ebe2d0";
    this.scene.background = new THREE.Color(galleryBg);
    this.scene.fog = new THREE.Fog(galleryBg, 10.5, 24);

    const hemisphere = new THREE.HemisphereLight("#fff7e8", "#6d5747", 2.15);
    this.scene.add(hemisphere);

    // Key light with tightly calibrated shadow camera bounds (smaller map on mobile GPUs)
    const shadowRes = this.isCompactGpu() ? 512 : 1024;
    const key = new THREE.DirectionalLight("#fff5e4", 3.85);
    key.position.set(-4.2, 7.2, 5.2);
    key.castShadow = true;
    key.shadow.mapSize.set(shadowRes, shadowRes);
    key.shadow.camera.left = -5.0;
    key.shadow.camera.right = 5.0;
    key.shadow.camera.top = 4.0;
    key.shadow.camera.bottom = -1.5;
    key.shadow.camera.near = 3.0;
    key.shadow.camera.far = 14.0;
    key.shadow.bias = -0.0004;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight("#c8d5e5", 1.85);
    rim.position.set(5, 3, -4);
    this.scene.add(rim);

    const warmBounce = new THREE.PointLight("#d79b72", 1.1, 10, 2);
    warmBounce.position.set(-3, 0.4, 3.2);
    this.scene.add(warmBounce);

    const wallGeo = new THREE.PlaneGeometry(34, 16);
    const wallMat = new THREE.MeshStandardMaterial({
      color: galleryBg,
      roughness: 1,
      metalness: 0,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 5, -3.2);
    wall.receiveShadow = true;
    this.scene.add(wall);
    this.galleryDisposables.push({ geometry: wallGeo, material: wallMat });

    const groundGeo = new THREE.PlaneGeometry(34, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: "#e2d7c2",
      roughness: 0.94,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.24;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.galleryDisposables.push({ geometry: groundGeo, material: groundMat });

    this.scene.add(this.shelfGroup);
    this.shelfGroup.add(this.shelfFurniture);

    // Mount framed credentials directly in gallery space so they cleanly frame all volumes
    this.scene.add(this.framedPicturesGroup);
    this.createGalleryArchitecture();
    this.createCredentialFrames();
  }

  private createGalleryArchitecture() {
    // Subtle lower Chalk wainscoting panel & Amaranth-accented architectural chair rail
    const dadoGeo = new THREE.PlaneGeometry(34, 3.2);
    const dadoMat = new THREE.MeshStandardMaterial({
      color: "#e2d5be",
      roughness: 0.98,
      metalness: 0,
    });
    const dado = new THREE.Mesh(dadoGeo, dadoMat);
    dado.position.set(0, 0.25, -3.17);
    dado.receiveShadow = true;
    this.scene.add(dado);
    this.galleryDisposables.push({ geometry: dadoGeo, material: dadoMat });

    const chairRailGeo = new THREE.BoxGeometry(34, 0.055, 0.08);
    const chairRailMat = new THREE.MeshStandardMaterial({
      color: "#cfc1a8",
      roughness: 0.85,
      metalness: 0.02,
    });
    const chairRail = new THREE.Mesh(chairRailGeo, chairRailMat);
    chairRail.position.set(0, 1.85, -3.14);
    this.scene.add(chairRail);
    this.galleryDisposables.push({ geometry: chairRailGeo, material: chairRailMat });

    // Delicate Amaranth architectural hairline fillet along the chair rail
    const railFilletGeo = new THREE.BoxGeometry(34, 0.014, 0.088);
    const railFilletMat = new THREE.MeshStandardMaterial({
      color: "#933B5B",
      roughness: 0.65,
      metalness: 0.08,
    });
    const railFillet = new THREE.Mesh(railFilletGeo, railFilletMat);
    railFillet.position.set(0, 1.878, -3.138);
    this.scene.add(railFillet);
    this.galleryDisposables.push({ geometry: railFilletGeo, material: railFilletMat });

    // Museum picture rail comfortably below the top header chrome
    const picRailGeo = new RoundedBoxGeometry(6.4, 0.044, 0.052, 2, 0.01);
    const picRailMat = new THREE.MeshStandardMaterial({
      color: "#553d2e",
      roughness: 0.62,
      metalness: 0.06,
    });
    const picRail = new THREE.Mesh(picRailGeo, picRailMat);
    picRail.position.set(0, 3.30, -0.57);
    picRail.castShadow = true;
    this.framedPicturesGroup.add(picRail);
    this.galleryDisposables.push({ geometry: picRailGeo, material: picRailMat });

    const brassRailGeo = new THREE.BoxGeometry(6.32, 0.012, 0.058);
    const brassRailMat = new THREE.MeshStandardMaterial({
      color: "#c6a355",
      roughness: 0.34,
      metalness: 0.72,
    });
    const brassRail = new THREE.Mesh(brassRailGeo, brassRailMat);
    brassRail.position.set(0, 3.298, -0.566);
    this.framedPicturesGroup.add(brassRail);
    this.galleryDisposables.push({ geometry: brassRailGeo, material: brassRailMat });
  }

  private createCredentialFrames() {
    const textureLoader = new THREE.TextureLoader();
    const pictureWidth = 1.18;
    const pictureHeight = 0.84;
    const matBorder = 0.06;
    const frameBorder = 0.042;
    const frameThick = 0.056;
    const matW = pictureWidth + matBorder * 2;
    const matH = pictureHeight + matBorder * 2;
    const outerW = matW + frameBorder * 2;
    const outerH = matH + frameBorder * 2;

    CREDENTIALS_CATALOG.forEach((cert) => {
      const geometries: THREE.BufferGeometry[] = [];
      const materials: THREE.Material[] = [];
      const textures: THREE.Texture[] = [];

      const frameGroup = new THREE.Group();
      const basePos = new THREE.Vector3(cert.wallX, cert.wallY, -0.52);
      frameGroup.position.copy(basePos);
      frameGroup.rotation.x = -0.035;
      frameGroup.rotation.y = cert.wallTilt;

      // Twin slim brass suspension rods anchoring frame to museum rail above
      const wireLen = Math.max(0.08, 3.29 - (cert.wallY + outerH * 0.5));
      const wireGeo = new THREE.CylinderGeometry(0.0055, 0.0055, wireLen, 8);
      const wireMat = new THREE.MeshStandardMaterial({
        color: "#c3a052",
        roughness: 0.36,
        metalness: 0.72,
      });
      geometries.push(wireGeo);
      materials.push(wireMat);

      [-outerW * 0.33, outerW * 0.33].forEach((wireX) => {
        const wire = new THREE.Mesh(wireGeo, wireMat);
        wire.position.set(wireX, outerH * 0.5 + wireLen * 0.5 - 0.01, -0.01);
        frameGroup.add(wire);
      });

      // Walnut outer frame molding
      const frameGeo = new RoundedBoxGeometry(outerW, outerH, frameThick, 3, 0.014);
      const frameMat = new THREE.MeshStandardMaterial({
        color: "#453024",
        roughness: 0.58,
        metalness: 0.08,
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.castShadow = true;
      frameMesh.receiveShadow = true;
      frameGroup.add(frameMesh);
      geometries.push(frameGeo);
      materials.push(frameMat);

      // Warm Chalk passe-partout archival mat board
      const matGeo = new THREE.PlaneGeometry(matW, matH);
      const matBoardMat = new THREE.MeshStandardMaterial({
        color: "#dcd0bc",
        roughness: 0.94,
        metalness: 0,
      });
      const matMesh = new THREE.Mesh(matGeo, matBoardMat);
      matMesh.position.set(0, 0, frameThick * 0.5 + 0.0015);
      matMesh.receiveShadow = true;
      frameGroup.add(matMesh);
      geometries.push(matGeo);
      materials.push(matBoardMat);

      // Palette fillet inner accent border (Amaranth / Sage counterpoint)
      const filletGeo = new THREE.PlaneGeometry(pictureWidth + 0.022, pictureHeight + 0.022);
      const filletMat = new THREE.MeshStandardMaterial({
        color: cert.accentHex,
        roughness: 0.78,
        metalness: 0.05,
      });
      const filletMesh = new THREE.Mesh(filletGeo, filletMat);
      filletMesh.position.set(0, 0, frameThick * 0.5 + 0.0028);
      frameGroup.add(filletMesh);
      geometries.push(filletGeo);
      materials.push(filletMat);

      // Certificate print face calibrated to avoid specular glare & whiteout
      const certTex = textureLoader.load(cert.image, () => {
        this.requestRender();
      });
      certTex.colorSpace = THREE.SRGBColorSpace;
      certTex.anisotropy = Math.min(
        this.isCompactGpu() ? 2 : 6,
        this.renderer.capabilities.getMaxAnisotropy(),
      );
      textures.push(certTex);

      const pictureGeo = new THREE.PlaneGeometry(pictureWidth, pictureHeight);
      const pictureMat = new THREE.MeshStandardMaterial({
        map: certTex,
        color: new THREE.Color("#ded5c4"),
        roughness: 0.92,
        metalness: 0.0,
      });
      const pictureMesh = new THREE.Mesh(pictureGeo, pictureMat);
      pictureMesh.position.set(0, 0, frameThick * 0.5 + 0.0042);
      pictureMesh.receiveShadow = true;
      frameGroup.add(pictureMesh);
      geometries.push(pictureGeo);
      materials.push(pictureMat);

      // Interactive hover perimeter highlight ring (subtle accent outline)
      const ringGeo = new THREE.RingGeometry(0.99, 1.015, 4);
      const hoverEdgeGeo = new THREE.EdgesGeometry(
        new THREE.BoxGeometry(outerW + 0.04, outerH + 0.04, 0.01),
      );
      const hoverRingMat = new THREE.MeshBasicMaterial({
        color: cert.accentHex,
        transparent: true,
        opacity: 0,
      });
      const hoverLines = new THREE.LineSegments(hoverEdgeGeo, hoverRingMat);
      hoverLines.position.set(0, 0, frameThick * 0.5 + 0.006);
      frameGroup.add(hoverLines);
      ringGeo.dispose();
      geometries.push(hoverEdgeGeo);
      materials.push(hoverRingMat);

      // Brushed brass museum plaque along bottom rail
      const plaqueGeo = new THREE.PlaneGeometry(outerW * 0.44, 0.044);
      const plaqueMat = new THREE.MeshStandardMaterial({
        color: "#cca857",
        roughness: 0.3,
        metalness: 0.72,
      });
      const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
      plaqueMesh.position.set(0, -outerH * 0.5 + 0.025, frameThick * 0.5 + 0.005);
      frameGroup.add(plaqueMesh);
      geometries.push(plaqueGeo);
      materials.push(plaqueMat);

      // Invisible generous raycast target for crisp hover & click
      const pickGeo = new THREE.BoxGeometry(outerW + 0.14, outerH + 0.14, frameThick + 0.14);
      const pickMat = new THREE.MeshBasicMaterial({ visible: false });
      const pickProxy = new THREE.Mesh(pickGeo, pickMat);
      pickProxy.userData.certId = cert.id;
      frameGroup.add(pickProxy);
      geometries.push(pickGeo);
      materials.push(pickMat);

      this.certPickTargets.push(pickProxy);
      this.framedPicturesGroup.add(frameGroup);
      this.runtimeCerts.push({
        data: cert,
        group: frameGroup,
        pickProxy,
        hoverRingMat,
        basePos,
        hover: 0,
        targetHover: 0,
        externalHover: false,
        textures,
        geometries,
        materials,
      });
    });
  }

  private createBooks() {
    const slotSpacing = SLOT_SPACING;

    this.booksData.forEach((book, index) => {
      const slotX = index * slotSpacing;
      const runtime = this.createBook(book, index, slotX);
      this.runtimeBooks.push(runtime);
      this.shelfGroup.add(runtime.slot);
    });

    this.motionLayout = createMotionLayout(
      this.runtimeBooks.map((book) => ({
        width: book.width,
        thickness: book.data.thickness,
      })),
    );

    // Continuous Architectural Wooden Gallery Shelf
    const totalSpan = (this.booksData.length - 1) * slotSpacing;
    const shelfWidth = totalSpan + 18;
    const shelfGeometry = new RoundedBoxGeometry(shelfWidth, 0.22, 1.85, 3, 0.04);
    const shelfMaterial = new THREE.MeshStandardMaterial({
      color: shelfColor,
      roughness: 0.68,
      metalness: 0.04,
    });
    const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
    shelf.name = "continuousShelf";
    shelf.position.set(totalSpan * 0.5, shelfTop - 0.11, -0.05);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    this.shelfFurniture.add(shelf);
    this.galleryDisposables.push({ geometry: shelfGeometry, material: shelfMaterial });

    // Slim brushed brass front inlay & sculptural palette-keyed architectural bookends
    const shelfBrassGeo = new THREE.BoxGeometry(shelfWidth, 0.014, 0.02);
    const shelfBrassMat = new THREE.MeshStandardMaterial({
      color: "#c5a153",
      roughness: 0.34,
      metalness: 0.72,
    });
    const shelfBrass = new THREE.Mesh(shelfBrassGeo, shelfBrassMat);
    shelfBrass.position.set(totalSpan * 0.5, shelfTop - 0.025, 0.878);
    this.shelfFurniture.add(shelfBrass);
    this.galleryDisposables.push({ geometry: shelfBrassGeo, material: shelfBrassMat });

    // Sculptural Amaranth & Brook August ceramic architectural bookends outside book slots
    const leftEndGeo = new RoundedBoxGeometry(0.22, 1.05, 0.76, 3, 0.03);
    const leftEndMat = new THREE.MeshStandardMaterial({
      color: "#8b3856",
      roughness: 0.72,
      metalness: 0.05,
    });
    const leftBookend = new THREE.Mesh(leftEndGeo, leftEndMat);
    leftBookend.position.set(-1.32, shelfTop + 0.525, -0.34);
    leftBookend.castShadow = true;
    leftBookend.receiveShadow = true;
    this.shelfFurniture.add(leftBookend);
    this.galleryDisposables.push({ geometry: leftEndGeo, material: leftEndMat });

    const rightEndGeo = new RoundedBoxGeometry(0.22, 1.05, 0.76, 3, 0.03);
    const rightEndMat = new THREE.MeshStandardMaterial({
      color: "#7b9081",
      roughness: 0.74,
      metalness: 0.04,
    });
    const rightBookend = new THREE.Mesh(rightEndGeo, rightEndMat);
    rightBookend.position.set(totalSpan + 1.32, shelfTop + 0.525, -0.34);
    rightBookend.castShadow = true;
    rightBookend.receiveShadow = true;
    this.shelfFurniture.add(rightBookend);
    this.galleryDisposables.push({ geometry: rightEndGeo, material: rightEndMat });

    // Architectural walnut corbel brackets supporting the gallery shelf
    const corbelGeo = new RoundedBoxGeometry(0.16, 0.42, 0.72, 2, 0.02);
    const corbelMat = new THREE.MeshStandardMaterial({
      color: "#4b3528",
      roughness: 0.65,
      metalness: 0.06,
    });
    this.galleryDisposables.push({ geometry: corbelGeo, material: corbelMat });
    [-2.4, 2.4, totalSpan + 2.4].forEach((cx) => {
      const corbel = new THREE.Mesh(corbelGeo, corbelMat);
      corbel.position.set(cx, shelfTop - 0.36, -0.46);
      corbel.castShadow = true;
      corbel.receiveShadow = true;
      this.shelfFurniture.add(corbel);
    });

    // Initial pose calculation
    this.updateAllBookPoses(0);
  }

  private createBook(book: CatalogBook, index: number, x: number): RuntimeBook {
    const slot = new THREE.Group();
    const content = new THREE.Group();
    const inspectionIdle = new THREE.Group();
    const physical = new THREE.Group();

    slot.add(content);
    content.add(inspectionIdle);
    inspectionIdle.add(physical);

    slot.position.set(x, shelfTop + book.height * 0.5, 0);

    const bookWidth = book.height * 0.64;
    const textureLoader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    const maxAniso = this.isCompactGpu() ? 2 : 4;

    let frontTex: THREE.Texture;
    if (book.coverImage) {
      frontTex = textureLoader.load(book.coverImage, () => this.requestRender());
      frontTex.colorSpace = THREE.SRGBColorSpace;
      frontTex.anisotropy = Math.min(maxAniso, this.renderer.capabilities.getMaxAnisotropy());
      frontTex.generateMipmaps = true;
      frontTex.minFilter = THREE.LinearMipmapLinearFilter;
    } else {
      frontTex = toTexture(createFrontCover(book), this.renderer, maxAniso);
    }
    textures.push(frontTex);

    const spineTex = toTexture(createSpineCover(book), this.renderer, maxAniso);
    const backTex = toTexture(createBackCover(book), this.renderer, maxAniso);
    textures.push(spineTex, backTex);

    // High performance single-pass PBR materials (inside spreads hydrated lazily on book inspect!)
    const pageMaterial = new THREE.MeshStandardMaterial({
      color: pageColor,
      roughness: 0.88,
      metalness: 0.02,
    });

    const frontSurfaceMaterial = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness: 0.36,
      metalness: 0.06,
    });

    const spineMaterial = new THREE.MeshStandardMaterial({
      map: spineTex,
      roughness: 0.52,
      metalness: 0.06,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.55,
      metalness: 0.05,
    });

    const insideCoverMaterial = new THREE.MeshStandardMaterial({
      color: pageColor,
      roughness: 0.82,
      metalness: 0.02,
    });

    const firstPageMaterial = new THREE.MeshStandardMaterial({
      color: pageColor,
      roughness: 0.82,
      metalness: 0.02,
    });

    // Cloth edge material styled with the book's leather/cloth base color
    const clothEdgeMaterial = new THREE.MeshStandardMaterial({
      color: book.cover,
      roughness: 0.62,
      metalness: 0.04,
    });

    const coverBoardThickness = 0.022;
    const pageBlockThickness = book.thickness - coverBoardThickness;

    // Body Mesh: Back cover + Spine + Page Block + Right Page Spread on face 4 (+Z)
    const bodyGeometry = new RoundedBoxGeometry(
      bookWidth,
      book.height,
      pageBlockThickness,
      3,
      0.015,
    );

    const bodyMaterials = [
      pageMaterial,       // +X: Right page edges
      spineMaterial,      // -X: Spine
      pageMaterial,       // +Y: Top pages
      pageMaterial,       // -Y: Bottom pages
      firstPageMaterial,  // +Z: First page spread (unveiled when book opens!)
      backMaterial,       // -Z: Back cover
    ];

    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterials);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    bodyMesh.position.set(0, 0, -coverBoardThickness * 0.5);
    physical.add(bodyMesh);

    // Front Cover Hinge Assembly: Pivot placed along spine edge (X = -bookWidth * 0.5, Z = book.thickness * 0.5)
    const coverHinge = new THREE.Group();
    coverHinge.position.set(-bookWidth * 0.5, 0, book.thickness * 0.5);
    physical.add(coverHinge);

    // Cover Board Mesh
    const coverGeometry = new RoundedBoxGeometry(
      bookWidth,
      book.height,
      coverBoardThickness,
      3,
      0.008,
    );

    const coverMaterials = [
      clothEdgeMaterial,    // +X: Outer cover edge (cloth-wrapped)
      spineMaterial,        // -X: Hinge seam (meets spine)
      clothEdgeMaterial,    // +Y: Top edge (cloth-wrapped)
      clothEdgeMaterial,    // -Y: Bottom edge (cloth-wrapped)
      frontSurfaceMaterial, // +Z: Front cover art
      insideCoverMaterial,  // -Z: Inside cover endpaper (unveiled when hinged open!)
    ];

    const coverMesh = new THREE.Mesh(coverGeometry, coverMaterials);
    coverMesh.castShadow = true;
    coverMesh.receiveShadow = true;
    coverMesh.position.set(bookWidth * 0.5, 0, -coverBoardThickness * 0.5);
    coverHinge.add(coverMesh);

    let titleDecal: THREE.Mesh | undefined;
    if (!book.coverImage) {
      const titleTex = toTexture(createTitleDecal(book), this.renderer, 4);
      textures.push(titleTex);
      const titleDecalMaterial = new THREE.MeshStandardMaterial({
        map: titleTex,
        transparent: true,
        roughness: 0.32,
        metalness: 0.12,
      });
      titleDecal = new THREE.Mesh(
        new THREE.PlaneGeometry(bookWidth * 0.95, book.height * 0.95),
        titleDecalMaterial,
      );
      titleDecal.position.set(0, 0, coverBoardThickness * 0.5 + 0.001);
      coverMesh.add(titleDecal);
    }

    const pickProxy = new THREE.Mesh(
      new THREE.BoxGeometry(bookWidth + 0.16, book.height + 0.16, book.thickness + 0.16),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    physical.add(pickProxy);
    this.pickTargets.push(pickProxy);

    return {
      data: book,
      index,
      slot,
      content,
      inspectionIdle,
      physical,
      bodyMesh,
      coverHinge,
      coverMesh,
      insideCoverMaterial,
      firstPageMaterial,
      spreadHydrated: false,
      titleDecal,
      pickProxy,
      x,
      width: bookWidth,
      pose: shelvedBookPose(this.motionLayout),
      hover: 0,
      targetHover: 0,
      openProgress: 0,
      textures,
    };
  }

  private ensureBookSpreadHydrated(index: number) {
    const runtime = this.runtimeBooks[index];
    if (!runtime || runtime.spreadHydrated) return;
    runtime.spreadHydrated = true;

    const compact = this.isCompactGpu();
    const spreadW = compact ? 784 : 1008;
    const spreadH = compact ? 1225 : 1575;
    const spreadAniso = compact ? 2 : 4;

    const insideCoverTex = toTexture(
      createInsideCover(runtime.data, spreadW, spreadH, () => {
        insideCoverTex.needsUpdate = true;
        this.requestRender();
      }),
      this.renderer,
      spreadAniso,
    );
    const firstPageTex = toTexture(
      createFirstPage(runtime.data, spreadW, spreadH, () => {
        firstPageTex.needsUpdate = true;
        this.requestRender();
      }),
      this.renderer,
      spreadAniso,
    );

    runtime.insideCoverMaterial.color.set("#ffffff");
    runtime.insideCoverMaterial.map = insideCoverTex;
    runtime.insideCoverMaterial.needsUpdate = true;

    runtime.firstPageMaterial.color.set("#ffffff");
    runtime.firstPageMaterial.map = firstPageTex;
    runtime.firstPageMaterial.needsUpdate = true;

    runtime.textures.push(insideCoverTex, firstPageTex);
  }

  private updateAllBookPoses(scrollValue: number) {
    this.shelfGroup.position.x = -scrollValue * SLOT_SPACING;

    for (let i = 0; i < this.runtimeBooks.length; i++) {
      const book = this.runtimeBooks[i];
      const offset = i - scrollValue;
      const pose = getCarouselPose(offset, SLOT_SPACING);
      book.pose = pose;

      const hoverLift = book.hover * 0.06;
      const hoverZ = book.hover * 0.12;
      const scaleCompY = (book.data.height * 0.5) * (pose.scale - 1);

      book.content.position.x = pose.x - offset * SLOT_SPACING;
      book.content.position.y = scaleCompY + (pose.y || 0) + hoverLift;
      book.content.position.z = pose.z + hoverZ;
      book.content.rotation.set(0, pose.yaw, 0);
      book.content.scale.setScalar(pose.scale);
    }
  }

  private handleControlsChange = () => {
    this.requestRender();
  };

  private handleControlsStart = () => {
    this.canvas.style.cursor = "grabbing";
  };

  private handleControlsEnd = () => {
    this.canvas.style.cursor = "grab";
  };

  private handleVisibilityChange = () => {
    if (this.isDisposed) return;
    if (document.hidden) {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = 0;
      }
      this.isAnimating = false;
    } else {
      // Resume rendering when the browser tab becomes visible again
      this.lastTimestamp = performance.now();
      this.requestRender();
    }
  };

  private handleIntersection = (entries: IntersectionObserverEntry[]) => {
    if (this.isDisposed) return;
    const isVisible = entries.some((entry) => entry.isIntersecting);
    if (this.isIntersecting !== isVisible) {
      this.isIntersecting = isVisible;
      if (isVisible) {
        this.lastTimestamp = performance.now();
        this.requestRender();
      } else {
        if (this.animationFrame) {
          cancelAnimationFrame(this.animationFrame);
          this.animationFrame = 0;
        }
        this.isAnimating = false;
      }
    }
  };

  private bindEvents() {
    this.onPointerDown = (e: PointerEvent) => {
      if (this.mode !== "browse") return;
      this.pointerDown = true;
      this.pointerStartX = e.clientX;
      this.pointerLastX = e.clientX;
      this.pointerLastTime = performance.now();
      this.dragVelocity = 0;
      this.dragStartScroll = this.currentScroll;
      this.pointerTravel = 0;
      this.canvas.classList.add("is-dragging");
      this.requestRender();
    };

    this.onPointerMove = (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.pointerDown && this.mode === "browse") {
        const deltaX = e.clientX - this.pointerStartX;
        this.pointerTravel += Math.abs(e.clientX - this.pointerLastX);
        const now = performance.now();
        const dt = Math.max(1, now - this.pointerLastTime);
        this.dragVelocity = (e.clientX - this.pointerLastX) / dt;
        this.pointerLastX = e.clientX;
        this.pointerLastTime = now;

        const dragSensitivity = Math.max(300, rect.width * 0.38);
        this.targetScroll = clamp(
          this.dragStartScroll - deltaX / dragSensitivity,
          0,
          this.booksData.length - 1,
        );
        this.requestRender();
      } else if (this.mode === "browse") {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const bookIntersects = this.raycaster.intersectObjects(this.pickTargets);
        const certIntersects = this.raycaster.intersectObjects(this.certPickTargets);

        // Prioritize foreground books if any overlap; otherwise check gallery certificates
        const hoveredBookProxy = bookIntersects[0]?.object;
        const hoveredCertProxy = !hoveredBookProxy ? certIntersects[0]?.object : undefined;
        let anyHovered = false;

        this.runtimeBooks.forEach((book) => {
          const isHovered = book.pickProxy === hoveredBookProxy;
          if (isHovered) anyHovered = true;
          const target = isHovered ? 1 : 0;
          if (book.targetHover !== target) {
            book.targetHover = target;
            this.requestRender();
          }
        });

        let nextHoveredCert: CredentialItem | null = null;
        this.runtimeCerts.forEach((cert) => {
          const isRayHovered = cert.pickProxy === hoveredCertProxy;
          if (isRayHovered) {
            anyHovered = true;
            nextHoveredCert = cert.data;
          }
          const target = isRayHovered || cert.externalHover ? 1 : 0;
          if (cert.targetHover !== target) {
            cert.targetHover = target;
            this.requestRender();
          }
        });

        const nextCertId = nextHoveredCert ? (nextHoveredCert as CredentialItem).id : null;
        if (nextCertId !== this.hoveredCertId) {
          this.hoveredCertId = nextCertId;
          this.callbacks.onHoverCertificate?.(nextHoveredCert);
        }

        this.canvas.style.cursor = anyHovered ? "pointer" : "grab";
      }
    };

    this.onPointerLeave = () => {
      if (this.mode !== "browse") return;
      let changed = false;
      this.runtimeBooks.forEach((book) => {
        if (book.targetHover !== 0) {
          book.targetHover = 0;
          changed = true;
        }
      });
      this.runtimeCerts.forEach((cert) => {
        const next = cert.externalHover ? 1 : 0;
        if (cert.targetHover !== next) {
          cert.targetHover = next;
          changed = true;
        }
      });
      if (this.hoveredCertId !== null) {
        this.hoveredCertId = null;
        this.callbacks.onHoverCertificate?.(null);
      }
      if (changed) this.requestRender();
    };

    this.onPointerUp = () => {
      if (!this.pointerDown) return;
      this.pointerDown = false;
      this.canvas.classList.remove("is-dragging");
      if (this.mode === "browse") {
        let snapTarget = Math.round(this.targetScroll);
        // If released with flick velocity, propel forward or backward
        if (Math.abs(this.dragVelocity) > 0.4) {
          const flickDir = this.dragVelocity > 0 ? -1 : 1;
          snapTarget = clamp(
            Math.round(this.currentScroll + flickDir * 0.6),
            0,
            this.booksData.length - 1,
          );
        }
        this.targetScroll = snapTarget;
        this.requestRender();
      }
    };

    this.onClick = () => {
      if (this.pointerTravel > 8 || this.mode !== "browse") return;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const bookIntersects = this.raycaster.intersectObjects(this.pickTargets);
      if (bookIntersects.length > 0) {
        const hitProxy = bookIntersects[0].object;
        const hitBook = this.runtimeBooks.find((b) => b.pickProxy === hitProxy);
        if (hitBook) {
          if (hitBook.index === this.activeIndex) {
            this.focusBook(hitBook.index);
          } else {
            this.browseTo(hitBook.index);
          }
        }
        return;
      }

      const certIntersects = this.raycaster.intersectObjects(this.certPickTargets);
      if (certIntersects.length > 0) {
        const hitCertProxy = certIntersects[0].object;
        const hitCert = this.runtimeCerts.find((c) => c.pickProxy === hitCertProxy);
        if (hitCert) {
          this.callbacks.onSelectCertificate?.(hitCert.data);
        }
      }
    };

    this.onWheel = (e: WheelEvent) => {
      if (this.mode !== "browse") return;
      const now = performance.now();
      if (now - this.lastWheelTime < 280) {
        return;
      }
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) > 14) {
        const dir = delta > 0 ? 1 : -1;
        const next = clamp(this.activeIndex + dir, 0, this.booksData.length - 1);
        if (next !== this.activeIndex) {
          this.lastWheelTime = now;
          this.browseTo(next);
        }
      }
    };

    this.onKeyDown = (e: KeyboardEvent) => {
      if (typeof document !== "undefined" && document.querySelector("dialog[open]")) {
        return;
      }
      const target = e.target as HTMLElement | null;
      if (
        (e.key === "Enter" || e.key === " ") &&
        target &&
        (target.tagName === "BUTTON" || target.tagName === "A")
      ) {
        return;
      }
      if (e.key === "Escape") {
        this.returnToShelf();
      } else if (e.key === "ArrowRight") {
        if (this.mode === "browse") this.browseTo(this.activeIndex + 1);
      } else if (e.key === "ArrowLeft") {
        if (this.mode === "browse") this.browseTo(this.activeIndex - 1);
      } else if (e.key === "Enter" || e.key === " ") {
        if (this.mode === "browse") {
          e.preventDefault();
          this.focusBook(this.activeIndex);
        }
      }
    };

    this.canvas.addEventListener("contextmenu", this.onContextMenu);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("click", this.onClick);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: true });
    window.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };
  private onPointerDown!: (e: PointerEvent) => void;
  private onPointerMove!: (e: PointerEvent) => void;
  private onPointerLeave!: () => void;
  private onPointerUp!: (e: PointerEvent) => void;
  private onClick!: () => void;
  private onWheel!: (e: WheelEvent) => void;
  private onKeyDown!: (e: KeyboardEvent) => void;

  public setHighlightedCertificate(certId: string | null) {
    let changed = false;
    this.runtimeCerts.forEach((cert) => {
      const ext = cert.data.id === certId;
      if (cert.externalHover !== ext) {
        cert.externalHover = ext;
        cert.targetHover = ext || this.hoveredCertId === cert.data.id ? 1 : 0;
        changed = true;
      }
    });
    if (changed) this.requestRender();
  }

  public requestRender = () => {
    if (this.isDisposed) return;
    if (typeof document !== "undefined" && document.hidden) return;
    if (!this.isIntersecting) return;
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.lastTimestamp = performance.now();
      this.animationFrame = requestAnimationFrame(this.animate);
    }
  };

  public browseTo(targetIndex: number) {
    const nextIndex = clamp(targetIndex, 0, this.booksData.length - 1);
    this.targetScroll = nextIndex;
    this.requestRender();
  }

  public getInspectLayout() {
    const parent = this.canvas.parentElement;
    const clientW = parent?.clientWidth || window.innerWidth;
    const clientH = parent?.clientHeight || window.innerHeight;
    const isCompact = clientW < 780;
    const activeBook = this.runtimeBooks[this.activeIndex];
    const bWidth = activeBook ? activeBook.width : 1.38;
    const spreadW = bWidth * 2.0;
    const spreadH = activeBook ? activeBook.data.height : 2.16;

    let drawerWidthPx = 0;
    let drawerHeightPx = 0;
    const drawerEl = parent?.querySelector(".detail-drawer") as HTMLElement | null;
    if (this.isDrawerOpen) {
      if (!isCompact) {
        drawerWidthPx =
          drawerEl && drawerEl.offsetWidth > 0
            ? drawerEl.offsetWidth
            : Math.min(420, Math.max(320, clientW * 0.28));
      } else {
        drawerHeightPx =
          drawerEl && drawerEl.offsetHeight > 0
            ? drawerEl.offsetHeight
            : Math.round(clientH * 0.36);
      }
    }

    const drawerFraction = drawerWidthPx / clientW;
    const unobstructedFraction = isCompact ? 0.94 : Math.max(0.4, 1.0 - drawerFraction);
    const unobstructedHeightFraction = isCompact && this.isDrawerOpen
      ? Math.max(0.46, 1.0 - drawerHeightPx / clientH)
      : 1.0;

    const halfFovRad = THREE.MathUtils.degToRad(this.camera.fov * 0.5);
    // Comfortable reading framing: keep whole open spread unobstructed above mobile sheet or left of drawer
    const distForWidth = (spreadW * 1.12) / (2 * Math.tan(halfFovRad) * this.camera.aspect * unobstructedFraction);
    const distForHeight = (spreadH * 1.14) / (2 * Math.tan(halfFovRad) * unobstructedHeightFraction);

    const cameraDistance = Math.max(isCompact ? 5.3 : 4.95, Math.max(distForWidth, distForHeight));
    const focusBookY = isCompact ? 1.38 : 1.30;
    const focusBookZ = presentedZ + 0.35;
    // When content.position.x = bWidth * 0.5, the open spread is centered at world X = 0!
    const targetFocusX = bWidth * 0.5;

    return {
      isCompact,
      clientW,
      clientH,
      drawerWidthPx,
      drawerHeightPx,
      drawerFraction,
      targetFocusX,
      focusBookY,
      focusBookZ,
      cameraDistance,
    };
  }

  public updateInspectFraming() {
    const layout = this.getInspectLayout();
    this.targetCameraLookAt.set(0, layout.focusBookY, layout.focusBookZ);
    this.targetCameraPos.set(0, layout.focusBookY + 0.14, layout.focusBookZ + layout.cameraDistance);
    this.targetInspectTarget.set(0, layout.focusBookY, layout.focusBookZ);

    if (!layout.isCompact && layout.drawerWidthPx > 0) {
      this.targetViewOffsetX = Math.round(layout.drawerWidthPx * 0.5);
      this.targetViewOffsetY = 0;
    } else if (layout.isCompact && layout.drawerHeightPx > 0) {
      this.targetViewOffsetX = 0;
      this.targetViewOffsetY = Math.round(layout.drawerHeightPx * 0.52);
    } else {
      this.targetViewOffsetX = 0;
      this.targetViewOffsetY = 0;
    }
  }

  public focusBook(index: number) {
    const targetIndex = clamp(index, 0, this.booksData.length - 1);
    this.ensureBookSpreadHydrated(targetIndex);
    this.targetScroll = targetIndex;
    this.activeIndex = targetIndex;
    this.selectedIndex = targetIndex;
    this.callbacks.onActiveIndex(targetIndex);

    this.mode = "focusing";
    this.callbacks.onMode("focusing", targetIndex);
    this.updateInspectFraming();

    this.controls.enabled = false;
    this.requestRender();
  }

  public setNavTool(tool: "pan" | "orbit") {
    this.navTool = tool;
    if (tool === "pan") {
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      };
      this.controls.touches = {
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_PAN,
      };
    } else {
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      };
      this.controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      };
    }
    this.canvas.style.cursor = "grab";
    this.callbacks.onNavToolChange?.(tool);
    this.requestRender();
  }

  public getNavTool(): "pan" | "orbit" {
    return this.navTool;
  }

  public zoomIn() {
    if (this.mode !== "inspect" && this.mode !== "focusing") return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const curLen = offset.length();
    const nextLen = Math.max(this.controls.minDistance, curLen * 0.78);
    offset.setLength(nextLen);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
    this.requestRender();
  }

  public zoomOut() {
    if (this.mode !== "inspect" && this.mode !== "focusing") return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const curLen = offset.length();
    const nextLen = Math.min(this.controls.maxDistance, curLen * 1.25);
    offset.setLength(nextLen);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
    this.requestRender();
  }

  public resetView() {
    if (this.mode !== "inspect" && this.mode !== "focusing") return;
    this.updateInspectFraming();
    this.isResetting = true;
    this.controls.enabled = false;
    this.requestRender();
  }

  public setDrawerOpen(isOpen: boolean) {
    this.isDrawerOpen = isOpen;
    if (this.mode === "inspect" || this.mode === "focusing") {
      this.updateInspectFraming();
      this.requestRender();
    }
  }

  public isDrawerVisible(): boolean {
    return this.isDrawerOpen;
  }

  public returnToShelf() {
    if (this.mode === "browse") return;
    this.mode = "returning";
    this.controls.enabled = false;
    this.targetViewOffsetX = 0;
    this.targetViewOffsetY = 0;
    this.callbacks.onMode("returning", this.selectedIndex);

    this.targetCameraPos.copy(this.responsiveBrowseCamera);
    this.targetCameraLookAt.copy(this.responsiveBrowseTarget);

    this.requestRender();
  }

  private handleResize = () => {
    if (!this.canvas || !this.renderer) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = parent.clientHeight || window.innerHeight;
    const aspect = width / height;
    this.camera.aspect = aspect;

    const isCompact = width < 780;

    // Total vertical height required to frame shelf + book + top gallery rail with clean header clearance
    let targetWorldHeight = 4.35;
    if (isCompact) {
      targetWorldHeight = Math.max(4.35, 2.85 / Math.max(0.5, aspect));
    } else if (height < 740) {
      // Shorter browser viewports (e.g. 1366x768 or 125%/150% scaling)
      targetWorldHeight = 4.52;
    } else if (aspect < 1.5) {
      targetWorldHeight = 4.42;
    }

    const halfFovRad = THREE.MathUtils.degToRad(this.camera.fov * 0.5);
    const requiredDist = (targetWorldHeight * 0.5) / Math.tan(halfFovRad);
    const cameraZ = presentedZ + requiredDist;

    this.responsiveBrowseCamera.set(0, 1.44, cameraZ);
    this.responsiveBrowseTarget.set(0, 1.38, 0.15);

    if (this.mode === "browse") {
      this.targetCameraPos.copy(this.responsiveBrowseCamera);
      this.targetCameraLookAt.copy(this.responsiveBrowseTarget);
      if (!this.isAnimating) {
        this.camera.position.copy(this.responsiveBrowseCamera);
        this.currentCameraLookAt.copy(this.responsiveBrowseTarget);
        this.camera.lookAt(this.currentCameraLookAt);
      }
    } else if (this.mode === "inspect" || this.mode === "focusing") {
      this.updateInspectFraming();
      if (this.currentViewOffsetX > 0.5 || this.currentViewOffsetY > 0.5) {
        this.camera.setViewOffset(
          width,
          height,
          Math.round(this.currentViewOffsetX),
          Math.round(this.currentViewOffsetY),
          width,
          height,
        );
      } else {
        this.camera.clearViewOffset();
      }
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, this.isCompactGpu() ? 1.25 : 1.5),
    );

    // Keep flanking gallery frames cleanly visible across narrow viewports
    const frameScale = aspect < 1.38 ? clamp(aspect / 1.38, 0.56, 1) : 1;
    this.framedPicturesGroup.scale.setScalar(frameScale);
    this.framedPicturesGroup.position.y = (1 - frameScale) * 2.68;

    this.requestRender();
  };

  private animate = (timestamp: number) => {
    if (this.isDisposed || (typeof document !== "undefined" && document.hidden) || !this.isIntersecting) {
      this.isAnimating = false;
      return;
    }

    const delta = Math.min(
      0.05,
      this.lastTimestamp ? (timestamp - this.lastTimestamp) / 1000 : 0.016,
    );
    this.lastTimestamp = timestamp;

    let needsContinue = false;

    // Smooth responsive camera projection offset for side drawer (desktop) & bottom sheet (mobile)
    if (
      Math.abs(this.currentViewOffsetX - this.targetViewOffsetX) > 0.2 ||
      Math.abs(this.currentViewOffsetY - this.targetViewOffsetY) > 0.2
    ) {
      this.currentViewOffsetX = damp(this.currentViewOffsetX, this.targetViewOffsetX, 5.0, delta);
      this.currentViewOffsetY = damp(this.currentViewOffsetY, this.targetViewOffsetY, 5.0, delta);
      const parent = this.canvas.parentElement;
      const w = parent?.clientWidth || window.innerWidth;
      const h = parent?.clientHeight || window.innerHeight;
      if (Math.abs(this.currentViewOffsetX) > 0.5 || Math.abs(this.currentViewOffsetY) > 0.5) {
        this.camera.setViewOffset(
          w,
          h,
          Math.round(this.currentViewOffsetX),
          Math.round(this.currentViewOffsetY),
          w,
          h,
        );
      } else {
        this.currentViewOffsetX = 0;
        this.currentViewOffsetY = 0;
        this.camera.clearViewOffset();
        this.camera.updateProjectionMatrix();
      }
      needsContinue = true;
    } else if (
      this.targetViewOffsetX === 0 &&
      this.targetViewOffsetY === 0 &&
      this.camera.view &&
      this.camera.view.enabled
    ) {
      this.currentViewOffsetX = 0;
      this.currentViewOffsetY = 0;
      this.camera.clearViewOffset();
      this.camera.updateProjectionMatrix();
    }

    if (this.mode === "browse") {
      // Luxurious ease-out gliding transition: lambda = 3.8 gives ~0.75s silky, stately glide
      // Direct drag uses higher damping (18) for tactile 1:1 control
      const scrollLambda = this.pointerDown ? 18 : 3.8;
      this.currentScroll = damp(this.currentScroll, this.targetScroll, scrollLambda, delta);

      if (Math.abs(this.currentScroll - this.targetScroll) > 0.0002) {
        needsContinue = true;
      } else {
        this.currentScroll = this.targetScroll;
      }

      const activeCandidate = Math.round(this.currentScroll);
      if (activeCandidate !== this.activeIndex) {
        this.activeIndex = activeCandidate;
        this.callbacks.onActiveIndex(this.activeIndex);
      }

      // Shelf group glides along X
      this.shelfGroup.position.x = -this.currentScroll * SLOT_SPACING;

      // Animate framed certificate hover float & border highlight
      for (let c = 0; c < this.runtimeCerts.length; c++) {
        const cert = this.runtimeCerts[c];
        if (Math.abs(cert.hover - cert.targetHover) > 0.002) {
          cert.hover = damp(cert.hover, cert.targetHover, 12, delta);
          needsContinue = true;
        } else {
          cert.hover = cert.targetHover;
        }
        cert.group.position.set(
          cert.basePos.x,
          cert.basePos.y + cert.hover * 0.032,
          cert.basePos.z + cert.hover * 0.09,
        );
        cert.hoverRingMat.opacity = cert.hover * 0.85;
      }

      // Update individual book poses with lateral clearance and shelf grounding
      for (let i = 0; i < this.runtimeBooks.length; i++) {
        const book = this.runtimeBooks[i];
        const offset = i - this.currentScroll;
        const pose = getCarouselPose(offset, SLOT_SPACING);

        if (Math.abs(book.hover - book.targetHover) > 0.002) {
          book.hover = damp(book.hover, book.targetHover, 12, delta);
          needsContinue = true;
        } else {
          book.hover = book.targetHover;
        }

        const hoverLift = book.hover * 0.06;
        const hoverZ = book.hover * 0.12;
        const scaleCompY = (book.data.height * 0.5) * (pose.scale - 1);

        book.content.position.x = pose.x - offset * SLOT_SPACING;
        book.content.position.y = scaleCompY + (pose.y || 0) + hoverLift;
        book.content.position.z = pose.z + hoverZ;
        book.content.rotation.set(0, pose.yaw, 0);
        book.content.scale.setScalar(pose.scale);
      }

      // Camera smooth damping back to browse framing if returning or resizing
      const camDist = this.camera.position.distanceTo(this.responsiveBrowseCamera);
      const targetDist = this.currentCameraLookAt.distanceTo(this.responsiveBrowseTarget);
      if (camDist > 0.002 || targetDist > 0.002) {
        this.camera.position.x = damp(this.camera.position.x, this.responsiveBrowseCamera.x, 6, delta);
        this.camera.position.y = damp(this.camera.position.y, this.responsiveBrowseCamera.y, 6, delta);
        this.camera.position.z = damp(this.camera.position.z, this.responsiveBrowseCamera.z, 6, delta);
        this.currentCameraLookAt.x = damp(this.currentCameraLookAt.x, this.responsiveBrowseTarget.x, 6, delta);
        this.currentCameraLookAt.y = damp(this.currentCameraLookAt.y, this.responsiveBrowseTarget.y, 6, delta);
        this.currentCameraLookAt.z = damp(this.currentCameraLookAt.z, this.responsiveBrowseTarget.z, 6, delta);
        this.camera.lookAt(this.currentCameraLookAt);
        needsContinue = true;
      }
    } else if (this.mode === "focusing") {
      needsContinue = true;

      // Ensure shelf tracks active index
      this.currentScroll = damp(this.currentScroll, this.activeIndex, 8, delta);
      this.shelfGroup.position.x = -this.currentScroll * SLOT_SPACING;

      const layout = this.getInspectLayout();
      const activeBook = this.runtimeBooks[this.activeIndex];

      // Smooth camera interpolation towards inspect framing
      this.camera.position.x = damp(this.camera.position.x, this.targetCameraPos.x, 4.6, delta);
      this.camera.position.y = damp(this.camera.position.y, this.targetCameraPos.y, 4.6, delta);
      this.camera.position.z = damp(this.camera.position.z, this.targetCameraPos.z, 4.6, delta);

      this.currentCameraLookAt.x = damp(this.currentCameraLookAt.x, this.targetCameraLookAt.x, 4.6, delta);
      this.currentCameraLookAt.y = damp(this.currentCameraLookAt.y, this.targetCameraLookAt.y, 4.6, delta);
      this.currentCameraLookAt.z = damp(this.currentCameraLookAt.z, this.targetCameraLookAt.z, 4.6, delta);
      this.camera.lookAt(this.currentCameraLookAt);

      // Active book smoothly floats forward and front cover hinges open
      if (activeBook) {
        // Front cover opens around spine: 0 -> -171 degrees (-2.98 rad)
        activeBook.openProgress = damp(activeBook.openProgress, 1.0, 4.6, delta);
        const openAngle = activeBook.openProgress * (-Math.PI * 0.95);
        activeBook.coverHinge.rotation.y = openAngle;

        const baseSlotY = shelfTop + activeBook.data.height * 0.5;
        activeBook.content.position.x = damp(activeBook.content.position.x, layout.targetFocusX, 4.6, delta);
        activeBook.content.position.y = damp(activeBook.content.position.y, layout.focusBookY - baseSlotY, 4.6, delta);
        activeBook.content.position.z = damp(activeBook.content.position.z, layout.focusBookZ, 4.6, delta);

        // Gentle desk reading incline (look directly down into pages without oblique angle)
        activeBook.content.rotation.x = damp(activeBook.content.rotation.x, 0.08, 4.6, delta);
        activeBook.content.rotation.y = damp(activeBook.content.rotation.y, 0.0, 4.6, delta);
        activeBook.content.rotation.z = damp(activeBook.content.rotation.z, 0.0, 4.6, delta);
        activeBook.content.scale.setScalar(damp(activeBook.content.scale.x, 0.96, 4.6, delta));
      }

      // Side books recess slightly into background and stay grounded on shelf
      for (let i = 0; i < this.runtimeBooks.length; i++) {
        if (i === this.activeIndex) continue;
        const b = this.runtimeBooks[i];
        const offset = i - this.currentScroll;
        const pose = getCarouselPose(offset, SLOT_SPACING);
        const sideScale = pose.scale * 0.88;
        const sideCompY = (b.data.height * 0.5) * (sideScale - 1);
        b.content.position.x = damp(b.content.position.x, pose.x - offset * SLOT_SPACING, 5, delta);
        b.content.position.y = damp(b.content.position.y, sideCompY, 5, delta);
        b.content.position.z = damp(b.content.position.z, pose.z - 0.45, 5, delta);
        b.content.scale.setScalar(damp(b.content.scale.x, sideScale, 5, delta));
      }

      const camDist = this.camera.position.distanceTo(this.targetCameraPos);
      const lookDist = this.currentCameraLookAt.distanceTo(this.targetCameraLookAt);
      const openRemaining = activeBook ? Math.abs(1.0 - activeBook.openProgress) : 0;

      if (camDist < 0.008 && lookDist < 0.008 && openRemaining < 0.01) {
        if (activeBook) {
          activeBook.openProgress = 1.0;
          activeBook.coverHinge.rotation.y = -Math.PI * 0.95;
          const baseSlotY = shelfTop + activeBook.data.height * 0.5;
          activeBook.content.position.set(layout.targetFocusX, layout.focusBookY - baseSlotY, layout.focusBookZ);
          activeBook.content.rotation.set(0.08, 0.0, 0.0);
          activeBook.content.scale.setScalar(0.96);
        }
        this.camera.position.copy(this.targetCameraPos);
        this.currentCameraLookAt.copy(this.targetCameraLookAt);
        this.camera.lookAt(this.currentCameraLookAt);

        this.mode = "inspect";
        this.controls.target.copy(this.targetInspectTarget);
        this.controls.enabled = true;
        this.canvas.style.cursor = "grab";
        this.callbacks.onMode("inspect", this.selectedIndex);
      }
    } else if (this.mode === "inspect") {
      const activeBook = this.runtimeBooks[this.activeIndex];
      if (activeBook) {
        const layout = this.getInspectLayout();
        const baseSlotY = shelfTop + activeBook.data.height * 0.5;
        if (Math.abs(activeBook.content.position.x - layout.targetFocusX) > 0.002) {
          activeBook.content.position.x = damp(activeBook.content.position.x, layout.targetFocusX, 5.2, delta);
          activeBook.content.position.y = damp(activeBook.content.position.y, layout.focusBookY - baseSlotY, 5.2, delta);
          activeBook.content.position.z = damp(activeBook.content.position.z, layout.focusBookZ, 5.2, delta);
          needsContinue = true;
        }
      }

      if (this.isResetting) {
        needsContinue = true;
        this.camera.position.lerp(this.targetCameraPos, delta * 6);
        this.controls.target.lerp(this.targetInspectTarget, delta * 6);
        this.currentCameraLookAt.copy(this.controls.target);
        this.camera.lookAt(this.currentCameraLookAt);
        if (
          this.camera.position.distanceTo(this.targetCameraPos) < 0.01 &&
          this.controls.target.distanceTo(this.targetInspectTarget) < 0.01
        ) {
          this.camera.position.copy(this.targetCameraPos);
          this.controls.target.copy(this.targetInspectTarget);
          this.camera.lookAt(this.targetInspectTarget);
          this.controls.enabled = true;
          this.controls.update();
          this.isResetting = false;
        }
      }

      // In inspect mode, OrbitControls only loops if active damping is running
      if (this.controls.enabled) {
        const isOrbiting = this.controls.update();
        if (isOrbiting) {
          needsContinue = true;
        }
      }
    } else if (this.mode === "returning") {
      needsContinue = true;

      // Active book smoothly closes: openProgress goes from 1 down to 0
      const activeBook = this.runtimeBooks[this.activeIndex];
      if (activeBook) {
        activeBook.openProgress = damp(activeBook.openProgress, 0.0, 5.2, delta);
        const openAngle = activeBook.openProgress * (-Math.PI * 0.95);
        activeBook.coverHinge.rotation.y = openAngle;

        const targetRestY = (activeBook.data.height * 0.5) * (presentedScale - 1) + 0.02;
        activeBook.content.position.x = damp(activeBook.content.position.x, 0, 5.2, delta);
        activeBook.content.position.y = damp(activeBook.content.position.y, targetRestY, 5.2, delta);
        activeBook.content.position.z = damp(activeBook.content.position.z, presentedZ, 5.2, delta);
        activeBook.content.rotation.x = damp(activeBook.content.rotation.x, 0, 5.2, delta);
        activeBook.content.rotation.y = damp(activeBook.content.rotation.y, 0, 5.2, delta);
        activeBook.content.rotation.z = damp(activeBook.content.rotation.z, 0, 5.2, delta);
        activeBook.content.scale.setScalar(damp(activeBook.content.scale.x, presentedScale, 5.2, delta));
      }

      // Smooth camera interpolation back to browse framing
      this.camera.position.x = damp(this.camera.position.x, this.responsiveBrowseCamera.x, 5.2, delta);
      this.camera.position.y = damp(this.camera.position.y, this.responsiveBrowseCamera.y, 5.2, delta);
      this.camera.position.z = damp(this.camera.position.z, this.responsiveBrowseCamera.z, 5.2, delta);

      this.currentCameraLookAt.x = damp(this.currentCameraLookAt.x, this.responsiveBrowseTarget.x, 5.2, delta);
      this.currentCameraLookAt.y = damp(this.currentCameraLookAt.y, this.responsiveBrowseTarget.y, 5.2, delta);
      this.currentCameraLookAt.z = damp(this.currentCameraLookAt.z, this.responsiveBrowseTarget.z, 5.2, delta);
      this.camera.lookAt(this.currentCameraLookAt);

      // Side books return to normal carousel poses with shelf grounding
      for (let i = 0; i < this.runtimeBooks.length; i++) {
        if (i === this.activeIndex) continue;
        const b = this.runtimeBooks[i];
        const offset = i - this.currentScroll;
        const pose = getCarouselPose(offset, SLOT_SPACING);
        const scaleCompY = (b.data.height * 0.5) * (pose.scale - 1);
        b.content.position.x = damp(b.content.position.x, pose.x - offset * SLOT_SPACING, 5.2, delta);
        b.content.position.y = damp(b.content.position.y, scaleCompY + (pose.y || 0), 5.2, delta);
        b.content.position.z = damp(b.content.position.z, pose.z, 5.2, delta);
        b.content.scale.setScalar(damp(b.content.scale.x, pose.scale, 5.2, delta));
      }

      const camDist = this.camera.position.distanceTo(this.responsiveBrowseCamera);
      const lookDist = this.currentCameraLookAt.distanceTo(this.responsiveBrowseTarget);
      const openRemaining = activeBook ? activeBook.openProgress : 0;

      if (camDist < 0.008 && lookDist < 0.008 && openRemaining < 0.008) {
        if (activeBook) {
          activeBook.openProgress = 0;
          activeBook.coverHinge.rotation.y = 0;
          activeBook.content.rotation.set(0, 0, 0);
        }
        this.camera.position.copy(this.responsiveBrowseCamera);
        this.currentCameraLookAt.copy(this.responsiveBrowseTarget);
        this.camera.lookAt(this.currentCameraLookAt);

        this.camera.clearViewOffset();
        this.camera.updateProjectionMatrix();
        this.currentViewOffsetX = 0;
        this.targetViewOffsetX = 0;
        this.currentViewOffsetY = 0;
        this.targetViewOffsetY = 0;

        this.mode = "browse";
        this.selectedIndex = null;
        this.callbacks.onMode("browse", null);
        this.updateAllBookPoses(this.activeIndex);
      }
    }

    this.renderer.render(this.scene, this.camera);

    // Adaptive idle throttling: only loop if actively animating or pointer is down
    if (needsContinue || this.pointerDown) {
      this.animationFrame = requestAnimationFrame(this.animate);
    } else {
      this.isAnimating = false;
    }
  };

  public getDiagnostics() {
    return {
      mode: this.mode,
      activeIndex: this.activeIndex,
      selectedIndex: this.selectedIndex,
      currentScroll: this.currentScroll,
      targetScroll: this.targetScroll,
      bookCount: this.runtimeBooks.length,
      isAnimating: this.isAnimating,
    };
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animationFrame);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.intersectionObserver) this.intersectionObserver.disconnect();
    this.canvas.removeEventListener("contextmenu", this.onContextMenu);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("click", this.onClick);
    this.canvas.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.controls.removeEventListener("change", this.handleControlsChange);
    this.controls.removeEventListener("start", this.handleControlsStart);
    this.controls.removeEventListener("end", this.handleControlsEnd);
    this.controls.dispose();

    this.runtimeCerts.forEach((cert) => {
      cert.textures.forEach((tex) => tex.dispose());
      cert.geometries.forEach((geo) => geo.dispose());
      cert.materials.forEach((mat) => mat.dispose());
    });

    this.galleryDisposables.forEach((item) => {
      item.geometry?.dispose();
      item.material?.dispose();
    });

    this.runtimeBooks.forEach((book) => {
      book.textures.forEach((tex) => tex.dispose());
      book.bodyMesh.geometry.dispose();
      (book.bodyMesh.material as THREE.Material[]).forEach((mat) => mat.dispose());
      book.coverMesh.geometry.dispose();
      (book.coverMesh.material as THREE.Material[]).forEach((mat) => mat.dispose());
      book.pickProxy.geometry.dispose();
      (book.pickProxy.material as THREE.Material).dispose();
      if (book.titleDecal) {
        book.titleDecal.geometry.dispose();
        (book.titleDecal.material as THREE.Material).dispose();
      }
    });
    this.renderer.dispose();
  }
}
