// ==========================================================
// SNMM 2026
// FINANCE & ROOM ALLOCATION
// APP.JS
// ==========================================================


// ==========================================================
// API CONFIGURATION
// ==========================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbx7Z-L7l4hTPvZu3fHDbFT-v3lSc6p0VEQNamyGeicHVo-a4apXDt7EQtwqKzoHPX0ibw/exec";


// ==========================================================
// GLOBAL DATA
// ==========================================================

let allReservations = [];

let currentReservation = null;


// ==========================================================
// PAGE INITIALIZATION
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    loadReservations();

  }
);


// ==========================================================
// LOAD RESERVATIONS
// ==========================================================

async function loadReservations() {

  showLoading(true);

  try {

    const response =
      await fetch(
        API_URL +
        "?action=getReservations"
      );

    const result =
      await response.json();

    if (!result.success) {

      showMessage(
        result.message ||
        "Unable to load reservations.",
        "danger"
      );

      return;

    }

    allReservations =
      result.reservations || [];

    updateSummary();

    filterReservations();

  }
  catch (error) {

    console.error(error);

    showMessage(
      "Unable to connect to the room reservation system.",
      "danger"
    );

  }
  finally {

    showLoading(false);

  }

}


// ==========================================================
// UPDATE SUMMARY CARDS
// ==========================================================

function updateSummary() {

  const total =
    allReservations.length;

  const paid =
    allReservations.filter(
      function (reservation) {

        return String(
          reservation.paymentStatus || ""
        ).trim() === "Paid";

      }
    ).length;

  const approved =
    allReservations.filter(
      function (reservation) {

        return String(
          reservation.approvalStatus || ""
        ).trim() === "Approved";

      }
    ).length;

  const allocated =
    allReservations.filter(
      function (reservation) {

        return String(
          reservation.status || ""
        ).trim() === "Allocated";

      }
    ).length;


  setText(
    "totalReservations",
    total
  );

  setText(
    "paidReservations",
    paid
  );

  setText(
    "approvedReservations",
    approved
  );

  setText(
    "allocatedReservations",
    allocated
  );

}


// ==========================================================
// FILTER RESERVATIONS
// ==========================================================

function filterReservations() {

  const search =
    String(
      document.getElementById(
        "searchInput"
      )?.value || ""
    )
      .trim()
      .toLowerCase();


  const status =
    document.getElementById(
      "statusFilter"
    )?.value || "All";


  const filtered =
    allReservations.filter(
      function (reservation) {

        const reservationId =
          String(
            reservation.reservationId || ""
          ).toLowerCase();

        const registrationCode =
          String(
            reservation.registrationCode || ""
          ).toLowerCase();

        const participantName =
          String(
            reservation.participantName || ""
          ).toLowerCase();

        const reservationStatus =
          String(
            reservation.status || ""
          ).trim();


        const matchesSearch =
          !search ||
          reservationId.includes(search) ||
          registrationCode.includes(search) ||
          participantName.includes(search);


        const matchesStatus =
          status === "All" ||
          reservationStatus === status ||
          (
            status === "Paid" &&
            String(
              reservation.paymentStatus || ""
            ).trim() === "Paid"
          ) ||
          (
            status === "Approved" &&
            String(
              reservation.approvalStatus || ""
            ).trim() === "Approved"
          );


        return (
          matchesSearch &&
          matchesStatus
        );

      }
    );


  renderReservations(
    filtered
  );

}


// ==========================================================
// RENDER RESERVATIONS
// ==========================================================

function renderReservations(
  reservations
) {

  const table =
    document.getElementById(
      "reservationTable"
    );


  if (!table) {
    return;
  }


  table.innerHTML = "";


  if (!reservations.length) {

    table.innerHTML = `

      <tr>

        <td
          colspan="8"
          class="text-center py-5 text-muted"
        >

          No reservations found.

        </td>

      </tr>

    `;

    return;

  }


  reservations.forEach(
    function (reservation) {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>

          <strong>
            ${escapeHtml(
              reservation.reservationId
            )}
          </strong>

          <br>

          <small class="text-muted">

            ${escapeHtml(
              reservation.registrationCode
            )}

          </small>

        </td>


        <td>

          <strong>
            ${escapeHtml(
              reservation.participantName
            )}
          </strong>

          <br>

          <small class="text-muted">

            ${escapeHtml(
              reservation.staffId || ""
            )}

          </small>

        </td>


        <td>

          ${escapeHtml(
            reservation.roomType || ""
          )}

        </td>


        <td>

          <strong>

            GH₵ ${Number(
              reservation.rate || 0
            ).toLocaleString(
              "en-GH",
              {
                minimumFractionDigits: 2
              }
            )}

          </strong>

          <br>

          <small class="text-muted">

            ${escapeHtml(
              reservation.rateType || ""
            )}

          </small>

        </td>


        <td>

          ${paymentBadge(
            reservation.paymentStatus
          )}

        </td>


        <td>

          ${approvalBadge(
            reservation.approvalStatus
          )}

        </td>


        <td>

          ${allocationBadge(
            reservation
          )}

        </td>


        <td>

          <div class="d-flex flex-wrap gap-1">

            ${buildActionButton(
              reservation
            )}

            <button
              class="btn btn-sm btn-outline-secondary"
              onclick="viewReservation(
                '${escapeJs(
                  reservation.reservationId
                )}'
              )"
            >

              👁️ View

            </button>

          </div>

        </td>

      `;


      table.appendChild(
        row
      );

    }
  );

}


// ==========================================================
// BUILD ACTION BUTTON
// ==========================================================

function buildActionButton(
  reservation
) {

  const status =
    String(
      reservation.status || ""
    ).trim();


  const paymentStatus =
    String(
      reservation.paymentStatus || ""
    ).trim();


  const approvalStatus =
    String(
      reservation.approvalStatus || ""
    ).trim();


  // --------------------------------------------------------
  // CANCELLED
  // --------------------------------------------------------

  if (
    status === "Cancelled"
  ) {

    return `

      <span class="badge bg-danger">

        Cancelled

      </span>

    `;

  }


  // --------------------------------------------------------
  // ALREADY ALLOCATED
  // --------------------------------------------------------

  if (
    status === "Allocated"
  ) {

    return `

      <span class="badge bg-success">

        ✓ Completed

      </span>

    `;

  }


  // --------------------------------------------------------
  // PAYMENT NOT CONFIRMED
  // --------------------------------------------------------

// --------------------------------------------------------
// PAYMENT NOT CONFIRMED
// --------------------------------------------------------

if (
  paymentStatus !== "Paid"
) {

  return `

    <div class="d-flex flex-wrap gap-1">

      <button
        class="btn btn-sm btn-success"
        onclick="openPaymentModal(
          '${escapeJs(
            reservation.reservationId
          )}'
        )"
      >

        💰 Confirm Payment

      </button>


      <button
        class="btn btn-sm btn-outline-danger"
        onclick="releaseReservation(
          '${escapeJs(
            reservation.reservationId
          )}'
        )"
      >

        ✕ Payment Not Done

      </button>

    </div>

  `;

}


  // --------------------------------------------------------
  // PAYMENT CONFIRMED BUT NOT APPROVED
  // --------------------------------------------------------

  if (
    approvalStatus !== "Approved"
  ) {

    return `

      <button
        class="btn btn-sm btn-primary"
        onclick="approveReservation(
          '${escapeJs(
            reservation.reservationId
          )}'
        )"
      >

        ✓ Approve

      </button>

    `;

  }


  // --------------------------------------------------------
  // PAYMENT + APPROVAL COMPLETE
  // --------------------------------------------------------

  return `

    <button
      class="btn btn-sm btn-primary"
      onclick="openAllocationModal(
        '${escapeJs(
          reservation.reservationId
        )}'
      )"
    >

      🏨 Allocate Room

    </button>

  `;

}


// ==========================================================
// PAYMENT BADGE
// ==========================================================

function paymentBadge(
  status
) {

  status =
    String(
      status || "Pending"
    ).trim();


  if (
    status === "Paid"
  ) {

    return `

      <span class="badge bg-success">
        ✓ Paid
      </span>

    `;

  }


  return `

    <span class="badge bg-warning text-dark">
      Pending
    </span>

  `;

}


// ==========================================================
// APPROVAL BADGE
// ==========================================================

function approvalBadge(
  status
) {

  status =
    String(
      status || "Pending"
    ).trim();


  if (
    status === "Approved"
  ) {

    return `

      <span class="badge bg-success">
        ✓ Approved
      </span>

    `;

  }


  return `

    <span class="badge bg-warning text-dark">
      Pending
    </span>

  `;

}


// ==========================================================
// ALLOCATION BADGE
// ==========================================================

function allocationBadge(
  reservation
) {

  if (
    String(
      reservation.status || ""
    ).trim() === "Allocated"
  ) {

    const block =
      reservation.blockName || "";

    const room =
      reservation.roomNumber || "";

    const bed =
      reservation.bedNumber || "";


    return `

      <span class="badge bg-success">

        ✓ Allocated

      </span>

      <br>

      <small class="text-muted">

        ${escapeHtml(block)}
        /
        ${escapeHtml(room)}

        ${
          bed
            ? "/ " + escapeHtml(bed)
            : ""
        }

      </small>

    `;

  }


  return `

    <span class="badge bg-secondary">

      Not Allocated

    </span>

  `;

}


// ==========================================================
// OPEN PAYMENT MODAL
// ==========================================================

function openPaymentModal(
  reservationId
) {

  const reservation =
    findReservation(
      reservationId
    );


  if (!reservation) {

    showMessage(
      "Reservation not found.",
      "danger"
    );

    return;

  }


  currentReservation =
    reservation;


  const idField =
    document.getElementById(
      "paymentReservationId"
    );


  const referenceField =
    document.getElementById(
      "paymentReference"
    );


  if (idField) {

    idField.value =
      reservationId;

  }


  if (referenceField) {

    referenceField.value = "";

  }


  const modalElement =
    document.getElementById(
      "paymentModal"
    );


  if (
    modalElement &&
    typeof bootstrap !== "undefined"
  ) {

    bootstrap.Modal
      .getOrCreateInstance(
        modalElement
      )
      .show();

  }

}


// ==========================================================
// CONFIRM PAYMENT
// ==========================================================

async function confirmPayment() {

  const reservationId =
    document.getElementById(
      "paymentReservationId"
    )?.value.trim();


  const paymentReference =
    document.getElementById(
      "paymentReference"
    )?.value.trim();


  if (!reservationId) {

    showMessage(
      "Reservation ID is required.",
      "danger"
    );

    return;

  }


  if (!paymentReference) {

    showMessage(
      "Please enter the payment reference.",
      "warning"
    );

    return;

  }


  showLoading(true);


  try {

    const url =
      API_URL +
      "?action=verifyPayment" +
      "&reservationId=" +
      encodeURIComponent(
        reservationId
      ) +
      "&paymentReference=" +
      encodeURIComponent(
        paymentReference
      );


    const response =
      await fetch(url);


    const result =
      await response.json();


    if (!result.success) {

      showMessage(
        result.message ||
        "Payment confirmation failed.",
        "danger"
      );

      return;

    }


    closeModal(
      "paymentModal"
    );


    showMessage(
      "Payment confirmed successfully. The reservation is now ready for approval.",
      "success"
    );


    await loadReservations();

  }
  catch (error) {

    console.error(error);

    showMessage(
      "Unable to confirm payment.",
      "danger"
    );

  }
  finally {

    showLoading(false);

  }

}

// ==========================================================
// RELEASE RESERVATION — PAYMENT NOT DONE
// ==========================================================

async function releaseReservation(
  reservationId
) {

  const reservation =
    findReservation(
      reservationId
    );


  if (!reservation) {

    showMessage(
      "Reservation not found.",
      "danger"
    );

    return;

  }


  const paymentStatus =
    String(
      reservation.paymentStatus || ""
    ).trim();


  if (
    paymentStatus === "Paid"
  ) {

    showMessage(
      "This reservation has already been paid and cannot be released as an unpaid reservation.",
      "warning"
    );

    return;

  }


  const participantName =
    reservation.participantName ||
    "this participant";


  const confirmed =
    confirm(
      "Payment has not been received for " +
      participantName +
      ".\n\n" +
      "Release this reservation and return the bed to the available room pool?"
    );


  if (!confirmed) {

    return;

  }


  showLoading(true);


  try {

    const url =
      API_URL +
      "?action=releaseReservation" +
      "&reservationId=" +
      encodeURIComponent(
        reservationId
      );


    const response =
      await fetch(url);


    const result =
      await response.json();


    if (!result.success) {

      showMessage(
        result.message ||
        "Unable to release the reservation.",
        "danger"
      );

      return;

    }


    showMessage(
      "Reservation released successfully. The bed has been returned to the available room pool.",
      "success"
    );


    await loadReservations();

  }
  catch (error) {

    console.error(
      "Release reservation error:",
      error
    );


    showMessage(
      "Unable to release the reservation.",
      "danger"
    );

  }
  finally {

    showLoading(false);

  }

}

// ==========================================================
// APPROVE RESERVATION
// ==========================================================

async function approveReservation(
  reservationId
) {

  const reservation =
    findReservation(
      reservationId
    );


  if (!reservation) {

    showMessage(
      "Reservation not found.",
      "danger"
    );

    return;

  }


  if (
    String(
      reservation.paymentStatus || ""
    ).trim() !== "Paid"
  ) {

    showMessage(
      "Payment must be confirmed before approval.",
      "warning"
    );

    return;

  }


  const confirmed =
    confirm(
      "Confirm approval of this accommodation reservation?"
    );


  if (!confirmed) {

    return;

  }


  showLoading(true);


  try {

    const url =
      API_URL +
      "?action=approveReservation" +
      "&reservationId=" +
      encodeURIComponent(
        reservationId
      );


    const response =
      await fetch(url);


    const result =
      await response.json();


    if (!result.success) {

      showMessage(
        result.message ||
        "Approval failed.",
        "danger"
      );

      return;

    }


    showMessage(
      "Reservation approved successfully. You can now allocate the room.",
      "success"
    );


    await loadReservations();

  }
  catch (error) {

    console.error(error);

    showMessage(
      "Unable to approve reservation.",
      "danger"
    );

  }
  finally {

    showLoading(false);

  }

}


// ==========================================================
// OPEN ALLOCATION MODAL
// ==========================================================

function openAllocationModal(
  reservationId
) {

  const reservation =
    findReservation(
      reservationId
    );


  if (!reservation) {

    showMessage(
      "Reservation not found.",
      "danger"
    );

    return;

  }


  if (
    String(
      reservation.paymentStatus || ""
    ).trim() !== "Paid"
  ) {

    showMessage(
      "Payment must be confirmed first.",
      "warning"
    );

    return;

  }


  if (
    String(
      reservation.approvalStatus || ""
    ).trim() !== "Approved"
  ) {

    showMessage(
      "Reservation must be approved first.",
      "warning"
    );

    return;

  }


  currentReservation =
    reservation;


  setValue(
    "allocationReservationId",
    reservationId
  );


  setValue(
    "blockName",
    ""
  );


  setValue(
    "roomNumber",
    ""
  );


  setValue(
    "bedNumber",
    ""
  );


  const participant =
    document.getElementById(
      "allocationParticipant"
    );


  if (participant) {

    participant.innerHTML = `

      <div class="alert alert-info">

        <div class="row g-2">

          <div class="col-md-6">

            <strong>Participant:</strong><br>

            ${escapeHtml(
              reservation.participantName
            )}

          </div>


          <div class="col-md-6">

            <strong>Registration:</strong><br>

            ${escapeHtml(
              reservation.registrationCode
            )}

          </div>


          <div class="col-md-6">

            <strong>Room Type:</strong><br>

            ${escapeHtml(
              reservation.roomType
            )}

          </div>


          <div class="col-md-6">

            <strong>Reservation:</strong><br>

            ${escapeHtml(
              reservation.reservationId
            )}

          </div>

        </div>

      </div>

    `;

  }


  const message =
    document.getElementById(
      "allocationMessage"
    );


  if (message) {

    message.innerHTML = "";

  }


  const modalElement =
    document.getElementById(
      "allocationModal"
    );


  if (
    modalElement &&
    typeof bootstrap !== "undefined"
  ) {

    bootstrap.Modal
      .getOrCreateInstance(
        modalElement
      )
      .show();

  }

}


// ==========================================================
// SUBMIT ROOM ALLOCATION
// ==========================================================

async function submitAllocation() {

  const reservationId =
    document.getElementById(
      "allocationReservationId"
    )?.value.trim();


  const blockName =
    document.getElementById(
      "blockName"
    )?.value.trim();


  const roomNumber =
    document.getElementById(
      "roomNumber"
    )?.value.trim();


  const bedNumber =
    document.getElementById(
      "bedNumber"
    )?.value.trim();


  if (!reservationId) {

    showAllocationMessage(
      "Reservation ID is missing.",
      "danger"
    );

    return;

  }


  if (!blockName) {

    showAllocationMessage(
      "Please select a block.",
      "warning"
    );

    return;

  }


  if (!roomNumber) {

    showAllocationMessage(
      "Please enter the room number.",
      "warning"
    );

    return;

  }


  if (!bedNumber) {

    showAllocationMessage(
      "Please enter the bed number.",
      "warning"
    );

    return;

  }


  const confirmed =
    confirm(
      "Confirm this room allocation?"
    );


  if (!confirmed) {

    return;

  }


  showLoading(true);


  try {

    const url =
      API_URL +
      "?action=allocateRoom" +
      "&reservationId=" +
      encodeURIComponent(
        reservationId
      ) +
      "&blockName=" +
      encodeURIComponent(
        blockName
      ) +
      "&roomNumber=" +
      encodeURIComponent(
        roomNumber
      ) +
      "&bedNumber=" +
      encodeURIComponent(
        bedNumber
      );


    const response =
      await fetch(url);


    const result =
      await response.json();


    if (!result.success) {

      showAllocationMessage(
        result.message ||
        "Room allocation failed.",
        "danger"
      );

      return;

    }


    closeModal(
      "allocationModal"
    );


    showMessage(
      "Room allocated successfully.",
      "success"
    );


    await loadReservations();

  }
  catch (error) {

    console.error(error);

    showAllocationMessage(
      "Unable to allocate room.",
      "danger"
    );

  }
  finally {

    showLoading(false);

  }

}


// ==========================================================
// VIEW RESERVATION
// ==========================================================

function viewReservation(
  reservationId
) {

  const reservation =
    findReservation(
      reservationId
    );


  if (!reservation) {

    showMessage(
      "Reservation not found.",
      "danger"
    );

    return;

  }


  currentReservation =
    reservation;


  const container =
    document.getElementById(
      "reservationDetails"
    );


  if (!container) {
    return;
  }


  container.innerHTML = `

    <div class="row g-3">

      <div class="col-md-6">

        <strong>
          Reservation ID
        </strong>

        <div>
          ${escapeHtml(
            reservation.reservationId
          )}
        </div>

      </div>


      <div class="col-md-6">

        <strong>
          Registration Code
        </strong>

        <div>
          ${escapeHtml(
            reservation.registrationCode
          )}
        </div>

      </div>


      <div class="col-md-6">

        <strong>
          Participant
        </strong>

        <div>
          ${escapeHtml(
            reservation.participantName
          )}
        </div>

      </div>


      <div class="col-md-6">

        <strong>
          Staff ID
        </strong>

        <div>
          ${escapeHtml(
            reservation.staffId || ""
          )}
        </div>

      </div>


      <div class="col-md-6">

        <strong>
          Room Type
        </strong>

        <div>
          ${escapeHtml(
            reservation.roomType
          )}
        </div>

      </div>


      <div class="col-md-6">

        <strong>
          Amount
        </strong>

        <div>

          GH₵ ${Number(
            reservation.rate || 0
          ).toLocaleString(
            "en-GH",
            {
              minimumFractionDigits: 2
            }
          )}

        </div>

      </div>


      <div class="col-md-4">

        <strong>
          Payment
        </strong>

        <div>

          ${paymentBadge(
            reservation.paymentStatus
          )}

        </div>

      </div>


      <div class="col-md-4">

        <strong>
          Approval
        </strong>

        <div>

          ${approvalBadge(
            reservation.approvalStatus
          )}

        </div>

      </div>


      <div class="col-md-4">

        <strong>
          Status
        </strong>

        <div>

          ${statusBadge(
            reservation.status
          )}

        </div>

      </div>


      <div class="col-12">

        <hr>

        <h6 class="fw-bold">
          Room Allocation
        </h6>

        ${
          String(
            reservation.status || ""
          ).trim() === "Allocated"

            ? `

              <div class="alert alert-success">

                <strong>
                  ✓ Room Allocated
                </strong>

                <br>

                Block:
                ${escapeHtml(
                  reservation.blockName || ""
                )}

                <br>

                Room:
                ${escapeHtml(
                  reservation.roomNumber || ""
                )}

                <br>

                Bed:
                ${escapeHtml(
                  reservation.bedNumber || ""
                )}

              </div>

            `

            : `

              <div class="alert alert-secondary">

                Room has not yet been allocated.

              </div>

            `
        }

      </div>

    </div>

  `;


  const modalElement =
    document.getElementById(
      "reservationModal"
    );


  if (
    modalElement &&
    typeof bootstrap !== "undefined"
  ) {

    bootstrap.Modal
      .getOrCreateInstance(
        modalElement
      )
      .show();

  }

}


// ==========================================================
// STATUS BADGE
// ==========================================================

function statusBadge(
  status
) {

  status =
    String(
      status || "Reserved"
    ).trim();


  let className =
    "bg-secondary";


  if (
    status === "Reserved"
  ) {

    className =
      "bg-warning text-dark";

  }


  if (
    status === "Allocated"
  ) {

    className =
      "bg-success";

  }


  if (
    status === "Cancelled"
  ) {

    className =
      "bg-danger";

  }


  return `

    <span class="badge ${className}">

      ${escapeHtml(status)}

    </span>

  `;

}


// ==========================================================
// FIND RESERVATION
// ==========================================================

function findReservation(
  reservationId
) {

  return allReservations.find(
    function (reservation) {

      return String(
        reservation.reservationId || ""
      ).trim() ===
      String(
        reservationId || ""
      ).trim();

    }
  );

}


// ==========================================================
// SHOW MESSAGE
// ==========================================================

function showMessage(
  message,
  type = "info"
) {

  const area =
    document.getElementById(
      "messageArea"
    );


  if (!area) {
    return;
  }


  area.innerHTML = `

    <div
      class="alert alert-${escapeHtml(type)}
           alert-dismissible fade show"
      role="alert"
    >

      ${escapeHtml(message)}

      <button
        type="button"
        class="btn-close"
        data-bs-dismiss="alert"
      ></button>

    </div>

  `;

}


// ==========================================================
// ALLOCATION MESSAGE
// ==========================================================

function showAllocationMessage(
  message,
  type = "info"
) {

  const area =
    document.getElementById(
      "allocationMessage"
    );


  if (!area) {
    return;
  }


  area.innerHTML = `

    <div class="alert alert-${escapeHtml(type)}">

      ${escapeHtml(message)}

    </div>

  `;

}


// ==========================================================
// LOADING OVERLAY
// ==========================================================

function showLoading(
  show
) {

  const overlay =
    document.getElementById(
      "loadingOverlay"
    );


  if (!overlay) {
    return;
  }


  overlay.classList.toggle(
    "d-none",
    !show
  );

}


// ==========================================================
// CLOSE MODAL
// ==========================================================

function closeModal(
  modalId
) {

  const element =
    document.getElementById(
      modalId
    );


  if (
    element &&
    typeof bootstrap !== "undefined"
  ) {

    const modal =
      bootstrap.Modal.getInstance(
        element
      );


    if (modal) {

      modal.hide();

    }

  }

}


// ==========================================================
// SET TEXT
// ==========================================================

function setText(
  elementId,
  value
) {

  const element =
    document.getElementById(
      elementId
    );


  if (element) {

    element.textContent =
      value;

  }

}


// ==========================================================
// SET VALUE
// ==========================================================

function setValue(
  elementId,
  value
) {

  const element =
    document.getElementById(
      elementId
    );


  if (element) {

    element.value =
      value;

  }

}


// ==========================================================
// HTML ESCAPE
// ==========================================================

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


// ==========================================================
// JAVASCRIPT ESCAPE
// ==========================================================

function escapeJs(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    )
    .replace(
      /\r?\n/g,
      "\\n"
    );

}

// ==========================================================
// DARK / LIGHT MODE
// ==========================================================

document.addEventListener("DOMContentLoaded", function () {

  initializeTheme();

});


// ==========================================================
// INITIALIZE THEME
// ==========================================================

function initializeTheme() {

  const savedTheme =
    localStorage.getItem("snmm-theme");

  if (savedTheme === "dark") {

    document.body.classList.add("dark-mode");

  }
  else {

    document.body.classList.remove("dark-mode");

  }

  updateThemeButton();

}


// ==========================================================
// TOGGLE THEME
// ==========================================================

function toggleTheme() {

  document.body.classList.toggle("dark-mode");

  const isDark =
    document.body.classList.contains("dark-mode");

  localStorage.setItem(
    "snmm-theme",
    isDark ? "dark" : "light"
  );

  updateThemeButton();

}


// ==========================================================
// UPDATE THEME BUTTON
// ==========================================================

function updateThemeButton() {

  const button =
    document.getElementById("themeToggle");

  if (!button) {
    return;
  }

  const isDark =
    document.body.classList.contains("dark-mode");


  if (isDark) {

    button.innerHTML =
      "☀️";

    button.classList.remove(
      "btn-light"
    );

    button.classList.add(
      "btn-warning"
    );

  }
  else {

    button.innerHTML =
      "🌙";

    button.classList.remove(
      "btn-warning"
    );

    button.classList.add(
      "btn-light"
    );

  }

}