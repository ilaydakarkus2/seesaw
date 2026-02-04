/* --- CONFIGURATION & CONSTANTS --- */
const CONFIG = {
  PHYSICS: {
    MAX_ANGLE: 30,
    ANGLE_DIVISOR: 10,
    PLANK_CENTER: 200,
  },
  STORAGE_KEY: "seesaw_simulation_v1",
};

/* --- STATE MANAGEMENT --- */
const State = {
  objects: [],
  nextWeight: 0,
  generateNextWeight() {
    this.nextWeight = Math.floor(Math.random() * 10) + 1;
    document.getElementById("next-weight-display").innerText =
      `${this.nextWeight} kg`;
  },
};

/* --- DOM CACHING --- */
const DOM = {
  plank: document.getElementById("plank"),
  objectsContainer: document.getElementById("objects-container"),
  leftWeight: document.getElementById("left-weight-display"),
  rightWeight: document.getElementById("right-weight-display"),
  tiltAngle: document.getElementById("tilt-angle-display"),
  resetBtn: document.getElementById("reset-button"),
  previewBall: document.getElementById("preview-ball"),
  simulationArea: document.getElementById("simulation-area"),
  logArea: document.getElementById("log-area"),
  leftTorque: document.getElementById("left-torque"),
  rightTorque: document.getElementById("right-torque"),
  balanceStatus: document.getElementById("balance-status"),
};

/* --- CORE LOGIC --- */

/**
 * Calculates torque and updates the visual state of the seesaw
 * Formula: Torque = Weight * Distance
 */
function updatePhysics() {
  let leftTorque = 0;
  let rightTorque = 0;
  let leftSum = 0;
  let rightSum = 0;

  State.objects.forEach((obj) => {
    const torqueValue = obj.weight * Math.abs(obj.distance);
    if (obj.distance < 0) {
      leftTorque += torqueValue;
      leftSum += obj.weight;
    } else {
      rightTorque += torqueValue;
      rightSum += obj.weight;
    }
  });
  if (DOM.leftTorque) DOM.leftTorque.textContent = leftTorque.toFixed(0);
  if (DOM.rightTorque) DOM.rightTorque.textContent = rightTorque.toFixed(0);
  if (DOM.balanceStatus) {
    const torqueDiff = leftTorque - rightTorque;
    if (Math.abs(torqueDiff) < 10) {
      // Çok küçük farklar dengede sayılır
      DOM.balanceStatus.textContent = "Balanced";
      DOM.balanceStatus.className = "status-balanced";
    } else {
      DOM.balanceStatus.textContent =
        torqueDiff > 0 ? "Tilting Left" : "Tilting Right";
      DOM.balanceStatus.className = "status-tilting";
    }
  }

  // Angle calculation based on torque difference
  const diff = rightTorque - leftTorque;
  const rawAngle = diff / CONFIG.PHYSICS.ANGLE_DIVISOR;
  const finalAngle = Math.max(
    -CONFIG.PHYSICS.MAX_ANGLE,
    Math.min(CONFIG.PHYSICS.MAX_ANGLE, rawAngle),
  );

  // UI Updates
  DOM.plank.style.transform = `rotate(${finalAngle}deg)`;
  DOM.leftWeight.textContent = `${leftSum.toFixed(1)} kg`;
  DOM.rightWeight.textContent = `${rightSum.toFixed(1)} kg`;
  DOM.tiltAngle.textContent = `${finalAngle.toFixed(1)}°`;

  saveToLocalStorage();
}

/**
 * Handles object placement when the plank is clicked
 */
DOM.plank.addEventListener("click", (e) => {
  const rect = DOM.plank.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const distance = clickX - CONFIG.PHYSICS.PLANK_CENTER;
  const newObj = {
    id: Date.now(),
    weight: State.nextWeight,
    distance: distance,
    color: `hsl(${Math.random() * 360}, 65%, 50%)`,
  };
  logDrop(State.nextWeight, distance);
  State.objects.push(newObj);
  renderObject(newObj);
  State.generateNextWeight();
  updatePhysics();
});

DOM.simulationArea.addEventListener("mousemove", (e) => {
  const rect = DOM.simulationArea.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  if (DOM.previewBall) {
    DOM.previewBall.style.opacity = "0.5";
    DOM.previewBall.style.left = `${mouseX}px`;
    DOM.previewBall.style.top = `${mouseY}px`;
    DOM.previewBall.innerText = `${State.nextWeight}kg`;
    DOM.previewBall.style.backgroundColor =
      State.nextWeight > 5 ? "#e74c3c" : "#3498db";

    const size = 20 + State.nextWeight * 2.5;
    DOM.previewBall.style.width = `${size}px`;
    DOM.previewBall.style.height = `${size}px`;
  }
});
DOM.simulationArea.addEventListener("mouseleave", () => {
  if (DOM.previewBall) {
    DOM.previewBall.style.opacity = "0";
  }
});
function renderObject(obj) {
  const el = document.createElement("div");
  el.className = "weight-box";

  const size = 20 + obj.weight * 2.5;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.backgroundColor = obj.color;
  el.style.left = `${obj.distance + CONFIG.PHYSICS.PLANK_CENTER}px`;
  el.innerText = obj.weight;

  DOM.objectsContainer.appendChild(el);
}

/* --- LOGGING --- */

function logDrop(weight, distance) {
  if (!DOM.logArea) return;

  if (DOM.logArea.querySelector("small")) {
    DOM.logArea.innerHTML = "";
  }

  const side =
    Math.abs(distance) < (CONFIG.PHYSICS.CENTER_THRESHOLD || 5)
      ? "center"
      : distance < 0
        ? "left"
        : "right";

  const px = Math.abs(distance).toFixed(0);

  const div = document.createElement("div");
  div.className = `log-entry ${weight > 5 ? "heavy" : ""}`;
  div.innerHTML = `
    <span><strong>${weight}kg</strong> dropped on <strong>${side}</strong></span>
    <span style="color: #94a3b8; font-size: 11px;">${px}px from center</span>
  `;
  div.style.padding = "2px 0";
  div.textContent = `${weight}kg dropped on ${side} side at ${px}px from center`;

  DOM.logArea.prepend(div);
}

/* --- PERSISTENCE & INITIALIZATION --- */

function saveToLocalStorage() {
  const dataToSave = {
    objects: State.objects,
    nextWeight: State.nextWeight,
  };
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(dataToSave));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem(CONFIG.STORAGE_KEY);
  if (!data) return;
  try {
    const parsedData = JSON.parse(data);
    if (parsedData && Array.isArray(parsedData.objects)) {
      State.objects = parsedData.objects;
      if (parsedData.nextWeight) {
        State.nextWeight = parsedData.nextWeight;
        document.getElementById("next-weight-display").innerText =
          `${State.nextWeight} kg`;
      }
      State.objects.forEach((obj) => renderObject(obj));
      updatePhysics();
    }
  } catch (e) {
    console.error("Failed to load simulation state:", e);
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    State.objects = [];
  }
}

DOM.resetBtn.addEventListener("click", () => {
  State.objects = [];
  DOM.objectsContainer.innerHTML = "";
  DOM.logArea.innerHTML =
    "<small>Simulation status: Ready to interact.</small>";
  localStorage.removeItem(CONFIG.STORAGE_KEY);
  updatePhysics();
});

State.generateNextWeight();
loadFromLocalStorage();
