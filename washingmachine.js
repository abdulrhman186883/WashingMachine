document.addEventListener("DOMContentLoaded", function () {
  const now = new Date();
  const currentHour = now.getHours();
  const formattedCurrentHour =
    currentHour < 10 ? `0${currentHour}` : currentHour;
  const defaultStartTime = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now
    .getDate()
    .toString()
    .padStart(2, "0")}T${formattedCurrentHour}:00`;

  document.getElementById("startTime").value = defaultStartTime;
});

const reservations = {
  washingMachine1: [],
  washingMachine2: [],
  clothesDryer: [],
};

function updateMachineStatus(machineType, status) {
  const statusElement = document.getElementById(`${machineType}Status`);
  statusElement.textContent = `${machineType}: ${status}`;
}

function reserveLaundry() {
  const machineType = document.getElementById("machineType").value;
  const name = document.getElementById("name").value;
  const dormRoom = document.getElementById("dormRoom").value;
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;

  const isAvailable = reservations[machineType].every((reservation) => {
    const reservationStartTime = new Date(reservation.startTime).getTime();
    const reservationEndTime = new Date(reservation.endTime).getTime();
    const newStartTime = new Date(startTime).getTime();
    const newEndTime = new Date(endTime).getTime();

    return (
      newEndTime <= reservationStartTime || newStartTime >= reservationEndTime
    );
  });

  if (isAvailable) {
    reservations[machineType].push({ name, dormRoom, startTime, endTime });

    const detailsContainer = document.getElementById("reservation-details");
    detailsContainer.innerHTML = `
          <p>Reservation Details:</p>
          <p><strong>Machine Type:</strong> ${machineType}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Dorm Room:</strong> ${dormRoom}</p>
          <p><strong>Start Time:</strong> ${startTime}</p>
          <p><strong>End Time:</strong> ${endTime}</p>
        `;

    updateMachineStatus(machineType, "Reserved");
  } else {
    alert(
      "Machine is already reserved for the selected time. Please choose another time."
    );
  }
}
