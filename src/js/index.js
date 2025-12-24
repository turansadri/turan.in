import { 
  Application,
  Assets,
  DisplacementFilter,
  Sprite,
} from 'pixi.js';
import '../css/index.css';

// Create loading screen
const loadingScreen = document.createElement('div');
loadingScreen.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: opacity 1.5s ease-out;
`;

const loader = document.createElement('div');
loader.style.cssText = `
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
`;

const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

document.head.appendChild(style);
loadingScreen.appendChild(loader);
document.body.appendChild(loadingScreen);

(async () => {
  // Ensure body is black during load
  document.body.style.background = 'black';
  
  const isMobile = window.innerWidth < 768;
  
  const app = new Application();
  await app.init({ 
    resizeTo: window,
    preference: 'webgpu',
    background: '#000000',
    resolution: window.devicePixelRatio || 1, // Retina/high-DPI support
    autoDensity: true, // CSS scaling for sharp rendering
    antialias: true, // Smoother edges
  });

  document.body.appendChild(app.canvas);
  
  // Hide canvas initially
  app.canvas.style.opacity = '0';
  app.canvas.style.transition = 'opacity 1.5s ease-in';

  // Load assets in parallel for faster loading
  const [displacementTexture, fishAsset, bgAsset] = await Promise.all([
    Assets.load('/dmaps/clouds.jpg'),
    Assets.load('/turska-sardiini.png'),
    Assets.load('/meri2.jpg')
  ]);

  displacementTexture.source.style.addressMode = 'repeat';

  const displacementSprite = Sprite.from(displacementTexture);
  displacementSprite.scale.set(4, 4);

  const fishDisplacementFilter = new DisplacementFilter({
    sprite: displacementSprite,
    scale: 40,
  });

  const bgDisplacementFilter = new DisplacementFilter({
    sprite: displacementSprite,
    scale: 20,
  });

  const backgroundImage = Sprite.from(bgAsset);
  backgroundImage.anchor.set(0.5);
  backgroundImage.alpha = 0.7;
  backgroundImage.filters = [bgDisplacementFilter];

  const fishImage = Sprite.from(fishAsset);
  fishImage.anchor.set(0.5);
  fishImage.texture.source.scaleMode = 'linear';
  fishImage.texture.source.antialias = true;
  fishImage.filters = [fishDisplacementFilter];

  function resize() {
    const isMobile = window.innerWidth < 768;
    const maxWidth = isMobile ? app.screen.width * 1.1 : 820;
    
    // Scale fish to fit max width while maintaining aspect ratio
    const scale = maxWidth / fishImage.texture.width;
    fishImage.scale.set(scale);
    
    fishImage.x = app.screen.width / 2;
    fishImage.y = app.screen.height / 1.3;

    const bgTexture = backgroundImage.texture;
    const screenRatio = app.screen.width / app.screen.height;
    const bgRatio = bgTexture.width / bgTexture.height;
    
    let bgScale;
    if (screenRatio > bgRatio) {
      bgScale = app.screen.width / bgTexture.width;
    } else {
      bgScale = app.screen.height / bgTexture.height;
    }
    
    backgroundImage.scale.set(bgScale);
    backgroundImage.x = app.screen.width / 2;
    backgroundImage.y = app.screen.height / 2;
  }

  displacementSprite.visible = false;
  app.stage.addChild(displacementSprite);
  app.stage.addChild(backgroundImage);
  app.stage.addChild(fishImage);

  resize();

  window.addEventListener('resize', resize);

  let animationSpeed = 2; // Slower animation on mobile
  app.ticker.add((time) => {
    displacementSprite.x += animationSpeed;
    displacementSprite.y += animationSpeed * 0.5;
  });

  loader.style.display = 'none';
  
  setTimeout(() => {
    app.canvas.style.opacity = '1';
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.remove();
    }, 1500);
  }, 100);
})();