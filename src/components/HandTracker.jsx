import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export default function HandTracker({ onTechChange }) {
  const containerRef = useRef(null);
  const videoBoxRef = useRef(null);

  useEffect(() => {
    const cleanup = setupScene();
    return cleanup;

    function setupScene() {
      if (!containerRef.current) return () => {};

      const COUNT = 20000;
      const LEFT_CENTER_X = -22;
      const RIGHT_CENTER_X = 22;
      const CROSS_THRESHOLD = 0.06;
      const INDEX_TOUCH_THRESHOLD = 0.085;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 55;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);

      const videoBox = document.createElement("div");
      videoBox.id = "video-tracking-box";
      videoBox.style.position = "fixed";
      videoBox.style.bottom = "20px";
      videoBox.style.right = "20px";
      videoBox.style.width = "300px";
      videoBox.style.height = "225px";
      videoBox.style.borderRadius = "12px";
      videoBox.style.overflow = "hidden";
      videoBox.style.zIndex = "100";
      videoBox.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.1)";
      videoBox.style.border = "2px solid rgba(255, 255, 255, 0.2)";
      videoBoxRef.current = videoBox;
      containerRef.current.appendChild(videoBox);

      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      videoBox.appendChild(canvas);

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(COUNT * 3);
      const colors = new Float32Array(COUNT * 3);
      const sizes = new Float32Array(COUNT);

      const targetPositions = new Float32Array(COUNT * 3);
      const targetColors = new Float32Array(COUNT * 3);
      const targetSizes = new Float32Array(COUNT);

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      const particles = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          size: 0.3,
          vertexColors: true,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        })
      );
      scene.add(particles);

      const getRed = (i) => {
        // Bright dense core - 22% of particles (more dense core)
        if (i < COUNT * 0.22) {
          const r = Math.random() * 8;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          return {
            x: r * Math.sin(phi) * Math.cos(theta),
            y: r * Math.sin(phi) * Math.sin(theta),
            z: r * Math.cos(phi),
            r: 1,      // Bright white
            g: 0.15,   // Slight red tint
            b: 0.15,   // Slight red tint
            s: 2.6,    // Large particles
          };
        }
        // Thick surrounding particles forming rings and sphere
        const theta = Math.random() * Math.PI * 2;
        const ring = i % 3 === 0;  // 1/3 of particles form rings
        const phi = ring
          ? Math.PI / 2 + (Math.random() - 0.5) * 0.22  // Flat ring
          : Math.acos(2 * Math.random() - 1);           // Sphere
        const radius = ring ? 20 + Math.random() * 6 : 10 + Math.random() * 16;
        return {
          x: radius * Math.sin(phi) * Math.cos(theta),
          y: radius * Math.sin(phi) * Math.sin(theta),
          z: radius * Math.cos(phi),
          r: 0.85,  // Bright red
          g: 0,
          b: 0,
          s: 1.0,
        };
      };

      const getBlue = (i) => {
        if (i < COUNT * 0.22) {
          const r = Math.random() * 8;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          return {
            x: r * Math.sin(phi) * Math.cos(theta),
            y: r * Math.sin(phi) * Math.sin(theta),
            z: r * Math.cos(phi),
            r: 1,
            g: 1,
            b: 1,
            s: 2.6,
          };
        }
        const theta = Math.random() * Math.PI * 2;
        const ring = i % 3 === 0;
        const phi = ring
          ? Math.PI / 2 + (Math.random() - 0.5) * 0.22
          : Math.acos(2 * Math.random() - 1);
        const radius = ring ? 20 + Math.random() * 6 : 10 + Math.random() * 16;
        return {
          x: radius * Math.sin(phi) * Math.cos(theta),
          y: radius * Math.sin(phi) * Math.sin(theta),
          z: radius * Math.cos(phi),
          r: 0.2,
          g: 0.62,
          b: 1,
          s: 1.0,
        };
      };

      const getPurple = (i) => {
        // Random scattered particles (like unstable energy)
        if (Math.random() > 0.8) {
          return {
            x: (Math.random() - 0.5) * 100,
            y: (Math.random() - 0.5) * 100,
            z: (Math.random() - 0.5) * 100,
            r: 0.5,
            g: 0.5,
            b: 0.7,
            s: 0.8,
          };
        }
        // Dense sphere
        const r = 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        return {
          x: r * Math.sin(phi) * Math.cos(theta),
          y: r * Math.sin(phi) * Math.sin(theta),
          z: r * Math.cos(phi),
          r: 0.6,
          g: 0.5,
          b: 1.0,
          s: 2.5,
        };
      };

      const getShrine = (i) => {
        const total = COUNT;
        // Blood fog floor
        if (i < total * 0.3) {
          return {
            x: (Math.random() - 0.5) * 80,
            y: -15,
            z: (Math.random() - 0.5) * 80,
            r: 0.4,
            g: 0,
            b: 0,
            s: 0.8,
          };
        }
        // Shrine pillars
        else if (i < total * 0.4) {
          const px = ((i % 4) < 2 ? 1 : -1) * 12;
          const pz = ((i % 4) % 2 == 0 ? 1 : -1) * 8;
          return {
            x: px + (Math.random() - 0.5) * 2,
            y: -15 + Math.random() * 30,
            z: pz + (Math.random() - 0.5) * 2,
            r: 0.2,
            g: 0.2,
            b: 0.2,
            s: 0.6,
          };
        }
        // Roof/altar with curve
        else if (i < total * 0.6) {
          const t = Math.random() * Math.PI * 2;
          const rad = Math.random() * 30;
          const curve = Math.pow(rad / 30, 2) * 10;
          return {
            x: rad * Math.cos(t),
            y: 15 - curve + Math.random() * 2,
            z: rad * Math.sin(t) * 0.6,
            r: 0.6,
            g: 0,
            b: 0,
            s: 0.6,
          };
        }
        // Empty particles
        else {
          return { x: 0, y: 0, z: 0, r: 0, g: 0, b: 0, s: 0 };
        }
      };

      const getVoid = (i) => {
        // Bright white ring at center (like Gojo's domain)
        if (i < COUNT * 0.15) {
          const angle = Math.random() * Math.PI * 2;
          return {
            x: 26 * Math.cos(angle),
            y: 26 * Math.sin(angle),
            z: (Math.random() - 0.5) * 1,
            r: 1,
            g: 1,
            b: 1,
            s: 2.5,
          };
        } else {
          // Massive expanding blue void
          const radius = 30 + Math.random() * 90;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          return {
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.sin(phi) * Math.sin(theta),
            z: radius * Math.cos(phi),
            r: 0.1,
            g: 0.6,
            b: 1.0,
            s: 0.7,
          };
        }
      };

      const getNeutral = (i) => {
        if (i < COUNT * 0.05) {
          const r = 15 + Math.random() * 20;
          const t = Math.random() * 6.28;
          const ph = Math.random() * 3.14;
          return {
            x: r * Math.sin(ph) * Math.cos(t),
            y: r * Math.sin(ph) * Math.sin(t),
            z: r * Math.cos(ph),
            r: 0.12,
            g: 0.12,
            b: 0.22,
            s: 0.45,
          };
        }
        return { x: 0, y: 0, z: 0, r: 0, g: 0, b: 0, s: 0 };
      };

      const getExplosion = () => {
        const radius = 6 + Math.pow(Math.random(), 0.35) * 70;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const blueWeight = Math.random();
        return {
          x: radius * Math.sin(phi) * Math.cos(theta),
          y: radius * Math.sin(phi) * Math.sin(theta),
          z: radius * Math.cos(phi),
          r: 0.9 - 0.45 * blueWeight,
          g: 0.15 + 0.35 * blueWeight,
          b: 0.2 + 0.75 * blueWeight,
          s: 1.4 + Math.random() * 2.6,
        };
      };

      const withOffset = (p, xOffset) => ({ ...p, x: p.x + xOffset });

      const setTargetsNeutral = () => {
        for (let i = 0; i < COUNT; i++) {
          const p = getNeutral(i);
          targetPositions[i * 3] = p.x;
          targetPositions[i * 3 + 1] = p.y;
          targetPositions[i * 3 + 2] = p.z;
          targetColors[i * 3] = p.r;
          targetColors[i * 3 + 1] = p.g;
          targetColors[i * 3 + 2] = p.b;
          targetSizes[i] = p.s;
        }
      };

      const setTargetsSplit = (leftRedActive, rightBlueActive) => {
        for (let i = 0; i < COUNT; i++) {
          let p;
          if (leftRedActive && rightBlueActive) {
            p =
              i % 2 === 0
                ? withOffset(getRed(i), LEFT_CENTER_X)
                : withOffset(getBlue(i), RIGHT_CENTER_X);
          } else if (leftRedActive) {
            p = withOffset(getRed(i), LEFT_CENTER_X);
          } else if (rightBlueActive) {
            p = withOffset(getBlue(i), RIGHT_CENTER_X);
          } else {
            p = getNeutral(i);
          }

          targetPositions[i * 3] = p.x;
          targetPositions[i * 3 + 1] = p.y;
          targetPositions[i * 3 + 2] = p.z;
          targetColors[i * 3] = p.r;
          targetColors[i * 3 + 1] = p.g;
          targetColors[i * 3 + 2] = p.b;
          targetSizes[i] = p.s;
        }
      };

      const setTargetsPurple = () => {
        for (let i = 0; i < COUNT; i++) {
          const p = getPurple(i);
          targetPositions[i * 3] = p.x;
          targetPositions[i * 3 + 1] = p.y;
          targetPositions[i * 3 + 2] = p.z;
          targetColors[i * 3] = p.r;
          targetColors[i * 3 + 1] = p.g;
          targetColors[i * 3 + 2] = p.b;
          targetSizes[i] = p.s;
        }
      };

      const setTargetsShrine = () => {
        for (let i = 0; i < COUNT; i++) {
          const p = getShrine(i);
          targetPositions[i * 3] = p.x;
          targetPositions[i * 3 + 1] = p.y;
          targetPositions[i * 3 + 2] = p.z;
          targetColors[i * 3] = p.r;
          targetColors[i * 3 + 1] = p.g;
          targetColors[i * 3 + 2] = p.b;
          targetSizes[i] = p.s;
        }
      };

      const setTargetsVoid = () => {
        for (let i = 0; i < COUNT; i++) {
          const p = getVoid(i);
          targetPositions[i * 3] = p.x;
          targetPositions[i * 3 + 1] = p.y;
          targetPositions[i * 3 + 2] = p.z;
          targetColors[i * 3] = p.r;
          targetColors[i * 3 + 1] = p.g;
          targetColors[i * 3 + 2] = p.b;
          targetSizes[i] = p.s;
        }
      };

      const setTargetsExplosion = () => {
        for (let i = 0; i < COUNT; i++) {
          const p = getExplosion();
          targetPositions[i * 3] = p.x;
          targetPositions[i * 3 + 1] = p.y;
          targetPositions[i * 3 + 2] = p.z;
          targetColors[i * 3] = p.r;
          targetColors[i * 3 + 1] = p.g;
          targetColors[i * 3 + 2] = p.b;
          targetSizes[i] = p.s;
        }
      };

      setTargetsNeutral();
      for (let i = 0; i < COUNT * 3; i++) {
        positions[i] = targetPositions[i];
        colors[i] = targetColors[i];
      }
      for (let i = 0; i < COUNT; i++) {
        sizes[i] = targetSizes[i];
      }

      const video = document.createElement("video");
      video.width = 640;
      video.height = 480;
      video.style.display = "none";
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;

      const MEDIAPIPE_HANDS_VERSION = "0.4.1675469240";
      const hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_HANDS_VERSION}/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55,
        selfieMode: false,
      });

      let currentPattern = "neutral";
      let visualTech = "neutral";
      let handCount = 0;
      let trackingStatus = "initializing";
      let frameErrorMessage = "";
      let isProcessingFrame = false;
      let lastHandVisuals = [];
      let explosionFrames = 0;
      let explosionLatched = false;
      let splitLeftActive = false;
      let splitRightActive = false;
      let stableModeCandidate = "neutral";
      let stableModeFrames = 0;
      let noHandsFrames = 0;
      let debugTouchDistance = 999; // For debugging void
      
      // HYSTERESIS: Track previous finger states to prevent flickering
      let prevFingerStates = new Map(); // handId -> {indexUp, middleUp, ringUp, pinkyUp}

      // FIXED: Different debouncing for different transitions
      const FINGER_UP_MARGIN = 0.018;  // Threshold to detect finger going UP
      const FINGER_DOWN_MARGIN = 0.012; // Threshold to detect finger going DOWN (hysteresis)
      const FINGER_MCP_MARGIN = 0.012;
      const GESTURE_STABLE_FRAMES = 10;
      const SPLIT_MODE_FRAMES = 5;
      const HAND_LOST_RESET_FRAMES = 18;

      const colorSets = {
        neutral: {
          line: "rgba(220, 220, 220, 0.85)",
          point: "rgb(220, 220, 220)",
          border: "rgb(255, 255, 255)",
        },
        red: {
          line: "rgba(255, 50, 50, 1)",
          point: "rgb(255, 90, 90)",
          border: "rgb(255, 0, 0)",
        },
        blue: {
          line: "rgba(100, 200, 255, 1)",
          point: "rgb(160, 230, 255)",
          border: "rgb(0, 150, 255)",
        },
        both: {
          line: "rgba(200, 100, 255, 1)",
          point: "rgb(220, 160, 255)",
          border: "rgb(180, 80, 255)",
        },
        purple: {
          line: "rgba(180, 100, 255, 1)",
          point: "rgb(220, 160, 255)",
          border: "rgb(150, 0, 255)",
        },
        explode: {
          line: "rgba(255, 220, 140, 1)",
          point: "rgb(255, 240, 180)",
          border: "rgb(255, 190, 80)",
        },
        shrine: {
          line: "rgba(220, 40, 40, 1)",
          point: "rgb(255, 90, 90)",
          border: "rgb(200, 0, 0)",
        },
        void: {
          line: "rgba(100, 200, 255, 1)",
          point: "rgb(180, 230, 255)",
          border: "rgb(0, 255, 255)",
        },
      };

      function drawHands(ctx, handVisuals) {
        if (!handVisuals || handVisuals.length === 0) return;

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        handVisuals.forEach((hv) => {
          const lm = hv.landmarks;
          const colorsForHand = hv.colors;
          const fingerChains = [
            [0, 1, 2, 3, 4],
            [0, 5, 6, 7, 8],
            [0, 9, 10, 11, 12],
            [0, 13, 14, 15, 16],
            [0, 17, 18, 19, 20],
          ];
          const palmLoop = [0, 5, 9, 13, 17, 0];

          ctx.strokeStyle = colorsForHand.border;
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          palmLoop.forEach((idx, i) => {
            const x = lm[idx].x * canvasWidth;
            const y = lm[idx].y * canvasHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();

          fingerChains.forEach((chain) => {
            ctx.strokeStyle = colorsForHand.line;
            ctx.lineWidth = 6;
            ctx.beginPath();
            chain.forEach((idx, i) => {
              const x = lm[idx].x * canvasWidth;
              const y = lm[idx].y * canvasHeight;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.stroke();
          });

          lm.forEach((point, idx) => {
            const x = point.x * canvasWidth;
            const y = point.y * canvasHeight;
            const jointSize = [4, 8, 12, 16, 20].includes(idx) ? 6 : 3.5;
            ctx.fillStyle = colorsForHand.point;
            ctx.beginPath();
            ctx.arc(x, y, jointSize, 0, Math.PI * 2);
            ctx.fill();
          });
        });
      }

      function drawOverlay(ctx) {
        const overlayColor =
          visualTech === "red"
            ? colorSets.red.border
            : visualTech === "blue"
              ? colorSets.blue.border
              : visualTech === "both"
                ? colorSets.both.border
                : visualTech === "purple"
                  ? colorSets.purple.border
                  : visualTech === "explode"
                    ? colorSets.explode.border
                    : visualTech === "shrine"
                      ? colorSets.shrine.border
                      : visualTech === "void"
                        ? colorSets.void.border
                    : "rgb(255, 255, 255)";

        if (lastHandVisuals.length > 0) {
          const border = lastHandVisuals[0].colors.border;
          videoBox.style.borderColor = border;
          videoBox.style.boxShadow = `0 0 20px ${border}, inset 0 0 10px ${border}40`;
        } else {
          videoBox.style.borderColor = "rgba(255, 255, 255, 0.6)";
          videoBox.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.25)";
        }

        ctx.fillStyle = overlayColor;
        ctx.font = "bold 15px Arial";
        ctx.textAlign = "left";

        if (handCount === 0) {
          ctx.fillText("NO HAND DETECTED", 12, 22);
        }
        ctx.fillText(`MODE: ${visualTech.toUpperCase()}`, 12, 42);
        ctx.fillText(`HANDS: ${handCount}`, 12, 62);
        ctx.fillText(`STATUS: ${trackingStatus.toUpperCase()}`, 12, 82);
        ctx.fillText(
          `L:${splitLeftActive ? "ON" : "OFF"} R:${splitRightActive ? "ON" : "OFF"}`,
          12,
          102
        );
        if (currentPattern === "purple") {
          ctx.fillText(`PURPLE MODE - Show all 5 fingers to explode!`, 12, 122);
        }
        if (handCount >= 2 && debugTouchDistance < 999) {
          ctx.fillText(`TOUCH DIST: ${debugTouchDistance.toFixed(3)}`, 12, 142);
        }
        if (frameErrorMessage) {
          ctx.fillText(`ERROR: ${frameErrorMessage}`, 12, 162);
        }
      }

      hands.onResults((results) => {
        const landmarksList = results.multiHandLandmarks || [];
        handCount = landmarksList.length;
        trackingStatus = handCount > 0 ? "tracking" : "no_hands";
        
        // FIXED: Reset noHandsFrames when hands are detected
        if (handCount > 0) {
          noHandsFrames = 0;
        } else {
          noHandsFrames += 1;
          // Clear finger state history when no hands detected
          if (noHandsFrames > 3) {
            prevFingerStates.clear();
          }
        }

        const handData = landmarksList.map((lm, handIndex) => {
          // Create a unique ID for this hand based on wrist position
          const handId = `${Math.round(lm[0].x * 100)}_${Math.round(lm[0].y * 100)}`;
          const prevState = prevFingerStates.get(handId) || {
            indexUp: false,
            middleUp: false,
            ringUp: false,
            pinkyUp: false,
            thumbUp: false
          };
          
          // HYSTERESIS: Use different thresholds based on previous state
          const isFingerUp = (tip, pip, mcp, prevUp) => {
            const pipDiff = lm[pip].y - lm[tip].y;
            const mcpDiff = lm[mcp].y - lm[tip].y;
            
            if (prevUp) {
              // Finger was up - use lower threshold to keep it up (prevent flickering down)
              return pipDiff > FINGER_DOWN_MARGIN && mcpDiff > FINGER_DOWN_MARGIN;
            } else {
              // Finger was down - use higher threshold to raise it (prevent flickering up)
              return pipDiff > FINGER_UP_MARGIN && mcpDiff > FINGER_MCP_MARGIN;
            }
          };
          
          const isFingerDown = (tip, pip) => {
            return lm[tip].y - lm[pip].y > FINGER_UP_MARGIN * 0.5;
          };
          
          const thumbUp = isFingerUp(4, 3, 2, prevState.thumbUp);
          const indexUp = isFingerUp(8, 6, 5, prevState.indexUp);
          const middleUp = isFingerUp(12, 10, 9, prevState.middleUp);
          const ringUp = isFingerUp(16, 14, 13, prevState.ringUp);
          const pinkyUp = isFingerUp(20, 18, 17, prevState.pinkyUp);
          
          // Store current state for next frame
          prevFingerStates.set(handId, { indexUp, middleUp, ringUp, pinkyUp, thumbUp });
          
          const middleDown = isFingerDown(12, 10);
          const ringDown = isFingerDown(16, 14);
          const pinkyDown = isFingerDown(20, 18);
          
          const allFiveUp = thumbUp && indexUp && middleUp && ringUp && pinkyUp;
          const fourFingersUp = indexUp && middleUp && ringUp && pinkyUp;
          const indexOnly = indexUp && middleDown && ringDown && pinkyDown;
          
          const imDistance = Math.hypot(lm[8].x - lm[12].x, lm[8].y - lm[12].y);
          const crossedIM = indexUp && middleUp && imDistance < CROSS_THRESHOLD;

          const screenX = 1 - lm[0].x;
          const side = screenX < 0.5 ? "left" : "right";

          return {
            landmarks: lm,
            side,
            wristX: lm[0].x,
            indexUp,
            indexOnly,
            allFiveUp,
            fourFingersUp,
            crossedIM,
          };
        });

        let leftHand = handData.find((h) => h.side === "left");
        let rightHand = handData.find((h) => h.side === "right");
        // Force stable left/right mapping when both hands are visible.
        if (handData.length >= 2 && (!leftHand || !rightHand)) {
          const byScreenX = [...handData].sort((a, b) => (1 - a.wristX) - (1 - b.wristX));
          leftHand = byScreenX[0];
          rightHand = byScreenX[byScreenX.length - 1];
        }

        const leftIndexUp = Boolean(leftHand?.indexOnly);
        const rightIndexUp = Boolean(rightHand?.indexOnly);
        const bothCrossed = Boolean(leftHand?.crossedIM && rightHand?.crossedIM);
        const bothFiveUp = Boolean(leftHand?.allFiveUp && rightHand?.allFiveUp);
        const shrineActive = handData.some((h) => h.fourFingersUp);
        
        // Debug logging for purple/explosion
        if (bothCrossed) {
          console.log("Purple detected: Both hands crossed index+middle");
        }
        if (currentPattern === "purple" && bothFiveUp) {
          console.log("EXPLOSION TRIGGER: In purple mode with all five fingers up!");
        }
        
        // FIXED: More forgiving void detection - just need two hands with index up and touching
        let indexTouching = false;
        debugTouchDistance = 999;
        if (handData.length >= 2) {
          // Find any two hands where index fingers are up and close together
          for (let i = 0; i < handData.length - 1; i++) {
            for (let j = i + 1; j < handData.length; j++) {
              const h1 = handData[i];
              const h2 = handData[j];
              // Both must have index up (don't require strict indexOnly)
              if (h1.indexUp && h2.indexUp) {
                const distance = Math.hypot(
                  h1.landmarks[8].x - h2.landmarks[8].x,
                  h1.landmarks[8].y - h2.landmarks[8].y,
                  h1.landmarks[8].z - h2.landmarks[8].z
                );
                debugTouchDistance = distance;
                // Increased threshold for easier triggering
                const threshold = INDEX_TOUCH_THRESHOLD * 1.5;
                if (distance < threshold) {
                  indexTouching = true;
                  console.log(`Infinite Void triggered! Distance: ${distance.toFixed(4)} < ${threshold.toFixed(4)}`);
                  break;
                } else if (h1.indexUp && h2.indexUp) {
                  console.log(`Both index up but not touching. Distance: ${distance.toFixed(4)}, need < ${threshold.toFixed(4)}`);
                }
              }
            }
            if (indexTouching) break;
          }
        }

        let signPattern = "neutral";
        if (indexTouching) {
          signPattern = "void";
        } else if (bothCrossed) {
          signPattern = "purple";
        } else if (shrineActive) {
          signPattern = "shrine";
        } else if (leftIndexUp || rightIndexUp) {
          signPattern = "split";
        }
        
        // Track if split configuration changed (important for immediate updates)
        const prevSplitLeft = splitLeftActive;
        const prevSplitRight = splitRightActive;
        const newSplitLeft = leftIndexUp;
        const newSplitRight = rightIndexUp;
        const splitConfigChanged = (prevSplitLeft !== newSplitLeft) || (prevSplitRight !== newSplitRight);

        let requestedPattern = currentPattern;
        if (explosionFrames > 0) {
          requestedPattern = "explode";
          explosionFrames -= 1;
        } else if (currentPattern === "purple" && bothFiveUp) {
          // IMMEDIATE EXPLOSION: When in purple and all fingers up, trigger explosion NOW
          requestedPattern = "explode";
          explosionFrames = 18;
          explosionLatched = true;
          console.log("💥 EXPLOSION ACTIVATED!");
        } else if (explosionLatched) {
          if (signPattern !== "neutral") {
            requestedPattern = signPattern;
            explosionLatched = false;
          } else {
            requestedPattern = "explode";
          }
        } else {
          requestedPattern = signPattern;
        }

        // FIXED: Improved debouncing logic with special handling for split mode changes
        let nextPattern = currentPattern;
        if (requestedPattern === "explode") {
          // Explosion always triggers immediately
          nextPattern = "explode";
          stableModeCandidate = "neutral";
          stableModeFrames = 0;
        } else if (noHandsFrames >= HAND_LOST_RESET_FRAMES) {
          // Reset to neutral only after sustained hand loss
          nextPattern = "neutral";
          stableModeCandidate = "neutral";
          stableModeFrames = 0;
        } else if (currentPattern === "split" && requestedPattern === "split" && splitConfigChanged) {
          // SPECIAL CASE: In split mode, configuration changes are immediate
          // (adding/removing a hand while staying in split pattern)
          nextPattern = "split";
          stableModeCandidate = "split";
          stableModeFrames = 0;
        } else if (requestedPattern === currentPattern) {
          // Same gesture as current - stay in current mode
          nextPattern = currentPattern;
          stableModeCandidate = requestedPattern;
          stableModeFrames = 0;
        } else {
          // Different gesture detected - accumulate frames
          if (stableModeCandidate === requestedPattern) {
            stableModeFrames += 1;
          } else {
            // New candidate - reset counter
            stableModeCandidate = requestedPattern;
            stableModeFrames = 1;
          }
          // Use faster debouncing for entering split mode (pointing is a clear gesture)
          const requiredFrames = (requestedPattern === "split") ? SPLIT_MODE_FRAMES : GESTURE_STABLE_FRAMES;
          
          // Only switch after stable frames threshold
          if (stableModeFrames >= requiredFrames) {
            nextPattern = requestedPattern;
            stableModeCandidate = requestedPattern;
            stableModeFrames = 0;
          } else {
            // Not stable yet - keep current pattern
            nextPattern = currentPattern;
          }
        }

        let finalSplitConfigChanged = false;

        if (nextPattern === "split") {
          const newLeftActive = newSplitLeft;
          const newRightActive = newSplitRight;
          finalSplitConfigChanged = splitConfigChanged;
          
          splitLeftActive = newLeftActive;
          splitRightActive = newRightActive;
          
          if (finalSplitConfigChanged || currentPattern !== "split") {
            setTargetsSplit(newLeftActive, newRightActive);
          }
        }

        if (nextPattern !== currentPattern || (nextPattern === "split" && finalSplitConfigChanged)) {
          currentPattern = nextPattern;

          if (nextPattern === "split") {
            // FIXED: When both hands are up, call onTechChange with "both" or appropriate value
            if (leftIndexUp && rightIndexUp) onTechChange("both");
            else if (leftIndexUp) onTechChange("red");
            else if (rightIndexUp) onTechChange("blue");
            else onTechChange("neutral");
          } else if (nextPattern === "purple") {
            setTargetsPurple();
            onTechChange("purple");
          } else if (nextPattern === "shrine") {
            setTargetsShrine();
            onTechChange("shrine");
          } else if (nextPattern === "void") {
            setTargetsVoid();
            onTechChange("void");
          } else if (nextPattern === "explode") {
            setTargetsExplosion();
            onTechChange("purple");
          } else {
            setTargetsNeutral();
            onTechChange("neutral");
          }
        }

        if (nextPattern === "purple") {
          visualTech = "purple";
        } else if (nextPattern === "explode") {
          visualTech = "explode";
        } else if (nextPattern === "shrine") {
          visualTech = "shrine";
        } else if (nextPattern === "void") {
          visualTech = "void";
        } else if (leftIndexUp && rightIndexUp) {
          // FIXED: Show "both" when both hands are up, not "neutral"
          visualTech = "both";
        } else if (leftIndexUp) {
          visualTech = "red";
        } else if (rightIndexUp) {
          visualTech = "blue";
        } else {
          visualTech = "neutral";
        }

        lastHandVisuals = handData.map((h) => {
          let colorsForHand = colorSets.neutral;
          if (nextPattern === "purple") {
            colorsForHand = colorSets.purple;
          } else if (nextPattern === "shrine") {
            colorsForHand = colorSets.shrine;
          } else if (nextPattern === "void") {
            colorsForHand = colorSets.void;
          } else if (nextPattern === "explode") {
            colorsForHand = colorSets.explode;
          } else if (h.side === "left" && h.indexOnly) {
            colorsForHand = colorSets.red;
          } else if (h.side === "right" && h.indexOnly) {
            colorsForHand = colorSets.blue;
          }

          return {
            landmarks: h.landmarks,
            colors: colorsForHand,
          };
        });
      });

      const cameraUtils = new Camera(video, {
        onFrame: async () => {
          if (isProcessingFrame) return;
          if (video.readyState < 2) return;

          isProcessingFrame = true;
          try {
            await hands.send({ image: video });
            frameErrorMessage = "";
          } catch (error) {
            trackingStatus = "frame_error";
            frameErrorMessage = (error?.message || "unknown").slice(0, 48);
            console.warn("Hand frame skipped:", error.message);
          } finally {
            isProcessingFrame = false;
          }
        },
        width: 640,
        height: 480,
      });

      cameraUtils
        .start()
        .then(() => {
          trackingStatus = "camera_on";
          console.log("Hand tracking started");
        })
        .catch((err) => {
          trackingStatus = "camera_error";
          console.error("Camera error:", err);
        });

      function updateCanvasDisplay() {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch (e) {
          ctx.fillStyle = "rgba(20, 20, 30, 0.8)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        drawHands(ctx, lastHandVisuals);
        ctx.restore();

        drawOverlay(ctx);
        requestAnimationFrame(updateCanvasDisplay);
      }
      updateCanvasDisplay();

      function animate() {
        requestAnimationFrame(animate);

        const pos = particles.geometry.attributes.position.array;
        const col = particles.geometry.attributes.color.array;
        const siz = particles.geometry.attributes.size.array;
        
        const time = Date.now() * 0.001; // Time in seconds

        if (currentPattern === "split") {
          const spin = 0.04;
          const cos = Math.cos(spin);
          const sin = Math.sin(spin);
          for (let i = 0; i < COUNT; i++) {
            let centerX = 0;
            if (splitLeftActive && splitRightActive) {
              centerX = i % 2 === 0 ? LEFT_CENTER_X : RIGHT_CENTER_X;
            } else if (splitLeftActive) {
              centerX = LEFT_CENTER_X;
            } else if (splitRightActive) {
              centerX = RIGHT_CENTER_X;
            } else {
              continue;
            }

            const idx = i * 3;
            const dx = targetPositions[idx] - centerX;
            const dz = targetPositions[idx + 2];
            
            // Only rotate particles that are far from center (spiral arms, not core)
            const distFromCenter = Math.sqrt(dx * dx + dz * dz);
            if (distFromCenter > 8) { // Core radius is ~9, so rotate everything beyond that
              targetPositions[idx] = centerX + dx * cos - dz * sin;
              targetPositions[idx + 2] = dx * sin + dz * cos;
            }
          }
        } else if (currentPattern === "void") {
          // Add pulsing/breathing effect to void particles
          const pulse = Math.sin(time * 1.5) * 0.15 + 1; // Oscillates between 0.85 and 1.15
          for (let i = 0; i < COUNT; i++) {
            const idx = i * 3;
            // Apply pulse to particle positions (breathing effect)
            const x = targetPositions[idx];
            const y = targetPositions[idx + 1];
            const z = targetPositions[idx + 2];
            const distance = Math.sqrt(x * x + y * y + z * z);
            if (distance > 0) {
              const scale = pulse;
              pos[idx] = x * scale;
              pos[idx + 1] = y * scale;
              pos[idx + 2] = z * scale;
            }
          }
        }

        for (let i = 0; i < COUNT * 3; i++) {
          // Skip position update for void (already updated above with pulsing)
          if (currentPattern !== "void") {
            pos[i] += (targetPositions[i] - pos[i]) * 0.1;
          }
          col[i] += (targetColors[i] - col[i]) * 0.1;
        }
        for (let i = 0; i < COUNT; i++) {
          siz[i] += (targetSizes[i] - siz[i]) * 0.1;
        }

        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.color.needsUpdate = true;
        particles.geometry.attributes.size.needsUpdate = true;

        if (currentPattern === "split") {
          // Keep static - individual particles rotate around their cores
          particles.rotation.set(0, 0, 0);
        } else if (currentPattern === "purple") {
          particles.rotation.z += 0.2;
          particles.rotation.y += 0.05;
        } else if (currentPattern === "shrine") {
          // Keep the shrine static - no rotation
          particles.rotation.set(0, 0, 0);
        } else if (currentPattern === "void") {
          // Void: Slow rotation to emphasize the overwhelming infinite space
          particles.rotation.y += 0.008;
          particles.rotation.x += 0.002;
        } else if (currentPattern === "explode") {
          particles.rotation.z += 0.1;
          particles.rotation.x += 0.025;
        } else {
          particles.rotation.y += 0.005;
        }

        renderer.render(scene, camera);
      }
      animate();

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        try {
          cameraUtils.stop();
          if (containerRef.current?.contains(renderer.domElement)) {
            containerRef.current.removeChild(renderer.domElement);
          }
          if (videoBoxRef.current && containerRef.current?.contains(videoBoxRef.current)) {
            containerRef.current.removeChild(videoBoxRef.current);
          }
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      };
    }
  }, [onTechChange]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}