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
    if (obj.distance < 0) {
      leftTorque += obj.weight * Math.abs(obj.distance);
      leftSum += obj.weight;
    } else {
      rightTorque += obj.weight * obj.distance;
      rightSum += obj.weight;
    }
  });

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

  State.objects.push(newObj);
  renderObject(newObj);
  State.generateNextWeight();
  updatePhysics();
});

function renderObject(obj) {
  const el = document.createElement("div");
  el.className = "weight-box";

  // Scale size based on weight for visual feedback
  const size = 20 + obj.weight * 2.5;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.backgroundColor = obj.color;
  el.style.left = `${obj.distance + CONFIG.PHYSICS.PLANK_CENTER}px`;
  el.innerText = obj.weight;

  DOM.objectsContainer.appendChild(el);
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
  localStorage.removeItem(CONFIG.STORAGE_KEY);
  updatePhysics();
});

State.generateNextWeight();
loadFromLocalStorage();
