// Import the functions you need from the SDKs

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  set,
  ref,
  get,
  child,
  push,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAinOzDBoxLsYtymoA6EBj86dD4FBT1BQ",
  authDomain: "am-herrenrodchen.firebaseapp.com",
  databaseURL:
    "https://am-herrenrodchen-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "am-herrenrodchen",
  storageBucket: "am-herrenrodchen.appspot.com",
  messagingSenderId: "97666665240",
  appId: "1:97666665240:web:a035bdc15d530708f22c6d",
  measurementId: "G-XK96527FY2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Function to check if the machine is currently occupied
function checkMachineOccupancy(machineType) {
  const reservationsRef = ref(database, "reservations");
  const currentTimestamp = new Date().getTime();

  return get(reservationsRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const reservations = snapshot.val();

        // Check if there is any reservation for the current machine
        return Object.values(reservations).some((reservation) => {
          return (
            reservation.machineType === machineType &&
            new Date(reservation.endTime).getTime() > currentTimestamp
          );
        });
      }
      return false;
    })
    .catch((error) => {
      console.error("Error checking machine occupancy:", error);
      return false;
    });
}

// Function to write data to the database if there are no conflicts
async function writeToDatabase(data) {
  const machineType = data.machineType;
  const startTime = data.startTime;
  const endTime = data.endTime;

  // Check for existing reservations with the same machine and overlapping time
  const hasConflicts = await checkExistingReservations(
    machineType,
    startTime,
    endTime
  );

  // Check if the machine is currently occupied
  const isMachineOccupied = await checkMachineOccupancy(machineType);

  if (hasConflicts || isMachineOccupied) {
    console.log("Conflict: Reservation already exists or machine is occupied");
  } else {
    // No conflicts, proceed with reservation
    const reservationsRef = ref(database, "reservations"); // Assuming 'reservations' as the data path
    const newReservationRef = push(reservationsRef); // Generate a new key for the reservation

    set(newReservationRef, {
      ...data,
      timestamp: serverTimestamp(),
    })
      .then(() => {
        console.log("Data written to the database successfully");
      })
      .catch((error) => {
        console.error("Error writing data to the database:", error);
      });
  }
}

// Function to check for existing reservations with overlapping time intervals
function checkExistingReservations(machineType, startTime, endTime) {
  const reservationsRef = ref(database, "reservations");

  return get(reservationsRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const reservations = snapshot.val();

        // Check if there is any reservation for the current machine with overlapping time
        return Object.values(reservations).some((reservation) => {
          const existingStartTime = new Date(reservation.startTime).getTime();
          const existingEndTime = new Date(reservation.endTime).getTime();

          const newStartTime = new Date(startTime).getTime();
          const newEndTime = new Date(endTime).getTime();

          // Check for overlapping time intervals
          return (
            reservation.machineType === machineType &&
            ((newStartTime >= existingStartTime &&
              newStartTime < existingEndTime) ||
              (newEndTime > existingStartTime &&
                newEndTime <= existingEndTime) ||
              (newStartTime <= existingStartTime &&
                newEndTime >= existingEndTime))
          );
        });
      }
      return false;
    })
    .catch((error) => {
      console.error("Error checking existing reservations:", error);
      return false;
    });
}

async function reserveLaundry() {
  const machineType = document.getElementById("machineType").value;
  const endTime = document.getElementById("endTime").value;
  const name = document.getElementById("name").value;
  const dormRoom = document.getElementById("dormRoom").value;
  const note = document.getElementById("note").value;

  // Check if name and dorm room are not empty
  if (!name || !dormRoom) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Name and Dorm Room cannot be empty",
    });
    return;
  }

  // Check for existing reservations with the same machine and end time
  const hasConflicts = await checkExistingReservations(
    machineType,
    startTime,
    endTime
  );

  if (hasConflicts) {
    Swal.fire({
      icon: "error",
      title: "Conflict",
      text: "Reservation already exists for the same machine and overlapping time",
    });
  } else {
    // No conflicts, proceed with reservation
    const startTime = document.getElementById("startTime").value;

    const reservationData = {
      machineType,
      name,
      dormRoom,
      startTime,
      endTime,
      note,
    };

    writeToDatabase(reservationData);

    // Display success message using SweetAlert2
    Swal.fire({
      icon: "success",
      title: "Success",
      text: "Reservation successfully made!",
    });
  }
}

// Trigger the function when the button is clicked
const buttons = document.getElementsByClassName("form-btn"); // Returns a collection

for (const button of buttons) {
  button.addEventListener("click", reserveLaundry);
}

// Function to remove a reservation
function removeReservation(event) {
  const machineType = event.target.dataset.machineType;
  const startTime = event.target.dataset.startTime;
  const endTime = event.target.dataset.endTime;

  const reservationsRef = ref(database, "reservations");

  get(reservationsRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const reservations = snapshot.val();

        const reservationKey = Object.keys(reservations).find((key) => {
          const reservation = reservations[key];
          return (
            reservation.machineType === machineType &&
            reservation.startTime === startTime &&
            reservation.endTime === endTime
          );
        });

        if (reservationKey) {
          const reservationToRemoveRef = child(reservationsRef, reservationKey);
          set(reservationToRemoveRef, null)
            .then(() => {
              console.log("Reservation removed:", reservationKey);
              // Optionally, you can add additional logic here if needed
            })
            .catch((error) => {
              console.error("Error removing reservation:", error);
            });
        }
      }
    })
    .catch((error) => {
      console.error("Error getting reservations:", error);
    });
}

// Function to check if the database has a record for each machine
function checkMachineStatus() {
  const machines = ["washingMachine1", "washingMachine2", "clothesDryer"];

  machines.forEach((machine) => {
    const machineStatusElement = document.getElementById(
      `${machine}StatusText`
    );

    const reservationsRef = ref(database, "reservations");
    const currentTimestamp = new Date().getTime();

    get(reservationsRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const reservations = snapshot.val();

          // Check if there is any reservation for the current machine
          const hasReservation = Object.values(reservations).some(
            (reservation) => {
              return (
                reservation.machineType === machine &&
                new Date(reservation.endTime).getTime() > currentTimestamp
              );
            }
          );

          if (hasReservation) {
            machineStatusElement.textContent = "Occupied";
            machineStatusElement.classList.remove("notoccupied-color");
            machineStatusElement.classList.add("occupied-color");

            // Add CSS class for red color
          } else {
            machineStatusElement.textContent = "Available";
            machineStatusElement.classList.remove("occupied-color");
            machineStatusElement.classList.add("notoccupied-color"); // Remove CSS class
          }
        }
      })
      .catch((error) => {
        console.error(`Error checking reservations for ${machine}:`, error);
      });
  });
}

// Call the function to check machine status initially
checkMachineStatus();

// Schedule the function to run periodically (e.g., every minute)
setInterval(checkMachineStatus, 1000);

// Function to format time as HH:MM:SS
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

// Function to calculate countdown
function calculateCountdown(endTime) {
  const countdown = Math.ceil(
    (new Date(endTime).getTime() - new Date().getTime()) / 1000
  );

  if (countdown >= 3600) {
    // If countdown is 1 hour or more, display in hours and minutes
    const hours = Math.floor(countdown / 3600);
    const remainingMinutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;
    return `${hours}h ${remainingMinutes}m ${seconds}s `;
  } else {
    // If countdown is less than 1 hour, display in minutes and seconds
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}m ${seconds}s`;
  }
}

// Function to pick up a reservation
function pickUpReservation(event) {
  const machineType = event.target.dataset.machineType;
  const startTime = event.target.dataset.startTime;
  const endTime = event.target.dataset.endTime;

  const reservationsRef = ref(database, "reservations");

  get(reservationsRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const reservations = snapshot.val();

        const reservationKey = Object.keys(reservations).find((key) => {
          const reservation = reservations[key];
          return (
            reservation.machineType === machineType &&
            reservation.startTime === startTime &&
            reservation.endTime === endTime
          );
        });

        if (reservationKey) {
          // Implement the logic for picking up the user's stuff (e.g., mark it as picked up)
          // and remove the reservation
          const reservationToRemoveRef = child(reservationsRef, reservationKey);
          set(reservationToRemoveRef, null)
            .then(() => {
              console.log("Reservation picked up and removed:", reservationKey);
              // Optionally, you can add additional logic here if needed
            })
            .catch((error) => {
              console.error("Error picking up reservation:", error);
            });
        }
      }
    })
    .catch((error) => {
      console.error("Error getting reservations:", error);
    });
}

async function displayReservationsInHTML() {
  const machines = ["washingMachine1", "washingMachine2", "clothesDryer"];

  for (const machineType of machines) {
    const reservationsRef = ref(database, "reservations");

    try {
      const snapshot = await get(reservationsRef);

      if (snapshot.exists()) {
        const reservations = snapshot.val();

        const machineReservations = Object.values(reservations).filter(
          (reservation) => reservation.machineType === machineType
        );

        const reservationsElement = document.getElementById(
          `${machineType}Reservations`
        );
        reservationsElement.innerHTML = "";

        if (machineReservations.length === 0) {
          // Display message when there are no reservations
          const emptyMessageDiv = document.createElement("div");
          emptyMessageDiv.classList.add("empty-message");
          emptyMessageDiv.innerHTML = `<p>No reservations for ${machineType}.</p>`;
          reservationsElement.appendChild(emptyMessageDiv);
        } else {
          machineReservations.forEach((reservation) => {
            const reservationDiv = document.createElement("div");
            reservationDiv.classList.add("reservation-item");
            const isPastReservation =
              new Date(reservation.endTime).getTime() < new Date().getTime();

            // Change background color based on reservation status
            reservationDiv.style.backgroundColor = isPastReservation
              ? "#7eff70"
              : "inherit";

            reservationDiv.innerHTML = `
              <div class="reservation-details">
                <p><strong>Machine Type:</strong> ${reservation.machineType}</p>
                <p><strong>Name:</strong> ${reservation.name}</p>
                <p><strong>Dorm Room:</strong> ${reservation.dormRoom}</p>
                <p><strong>Start Time:</strong> ${formatTime(
                  new Date(reservation.startTime)
                )}</p>
                <p><strong>End Time:</strong> ${formatTime(
                  new Date(reservation.endTime)
                )}</p>
                <p><strong>Countdown:</strong> ${calculateCountdown(
                  reservation.endTime
                )}</p>
                <p><strong> Notes </strong> ${reservation.note}</p>

                ${
                  isPastReservation
                    ? "<p><strong>Status:</strong> The Machine Finished. Please Pickup :)</p>"
                    : ""
                }
                <button class="remove-reservation-btn" 
                  data-machine-type="${reservation.machineType}"
                  data-start-time="${reservation.startTime}"
                  data-end-time="${reservation.endTime}">
                  Remove Reservation
                </button>
                ${
                  isPastReservation
                    ? `
                  <button class="pick-up-btn" 
                    data-machine-type="${reservation.machineType}"
                    data-start-time="${reservation.startTime}"
                    data-end-time="${reservation.endTime}">
                    Pick Up
                  </button>`
                    : ""
                }
              </div>
            `;

            reservationsElement.appendChild(reservationDiv);
          });
        }

        const removeReservationButtons = document.querySelectorAll(
          ".remove-reservation-btn"
        );
        removeReservationButtons.forEach((button) => {
          button.addEventListener("click", removeReservation);
        });

        const pickUpButtons = document.querySelectorAll(".pick-up-btn");
        pickUpButtons.forEach((button) => {
          button.addEventListener("click", pickUpReservation);
        });
      }
    } catch (error) {
      console.error(`Error retrieving reservations for ${machineType}:`, error);
    }
  }
}
// Wait for the initial call to complete data retrieval
await displayReservationsInHTML();

// Schedule the function to run periodically (e.g., every second)
setInterval(displayReservationsInHTML, 1000);

//
