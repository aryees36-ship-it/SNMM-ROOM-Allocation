// ==========================================================
// SNMM 2026
// FINANCE & ROOM ALLOCATION
// FINANCE.JS
// STABLE VERSION
// ==========================================================


// ==========================================================
// API
// ==========================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbx7Z-L7l4hTPvZu3fHDbFT-v3lSc6p0VEQNamyGeicHVo-a4apXDt7EQtwqKzoHPX0ibw/exec";


// ==========================================================
// CURRENT USER
// ==========================================================

const CURRENT_USER =
  "Finance & Room Allocation";


// ==========================================================
// GLOBAL DATA
// ==========================================================

let allReservations = [];

let currentReservation = null;

let allocationMode = "new";


// ==========================================================
// INITIALIZE
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initializeTheme();

    initializeListeners();

    refreshAll();

  }
);


// ==========================================================
// LISTENERS
// ==========================================================

function initializeListeners() {

  const search =
    document.getElementById(
      "searchInput"
    );


  if (search) {

    search.addEventListener(
      "input",
      filterReservations
    );

  }


  const filter =
    document.getElementById(
      "statusFilter"
    );


  if (filter) {

    filter.addEventListener(
      "change",
      filterReservations
    );

  }

}


// ==========================================================
// REFRESH EVERYTHING
// ==========================================================

async function refreshAll(
  showSpinner = true
) {

  if (showSpinner) {
    showLoading(true);
  }


  try {

    await Promise.all([
      loadReservations(false),
      loadDashboard(false)
    ]);

  } catch (error) {

    console.error(error);

    showMessage(
      "Unable to refresh the system.",
      "danger"
    );

  } finally {

    if (showSpinner) {
      showLoading(false);
    }

  }

}


// ==========================================================
// LOAD RESERVATIONS
// ==========================================================

async function loadReservations(
  showSpinner = true
) {

  if (showSpinner) {
    showLoading(true);
  }


  try {

    const result =
      await apiGet(
        "getReservations"
      );


    if (!result.success) {

      showMessage(
        result.message ||
          "Unable to load reservations.",
        "danger"
      );

      return;

    }


    allReservations =
      result.reservations ||
      result.data?.reservations ||
      [];


    filterReservations();


  } catch (error) {

    console.error(error);

    showMessage(
      error.message ||
        "Unable to load reservations.",
      "danger"
    );

  } finally {

    if (showSpinner) {
      showLoading(false);
    }

  }

}


// ==========================================================
// LOAD DASHBOARD
// ==========================================================

async function loadDashboard(
  showSpinner = false
) {

  if (showSpinner) {
    showLoading(true);
  }


  try {

    const result =
      await apiGet(
        "getDashboard"
      );


    if (!result.success) {

      showMessage(
        result.message ||
          "Unable to load dashboard.",
        "danger"
      );

      return;

    }


    const summary =
      result.summary ||
      result.data?.summary ||
      {};


    setText(
      "totalReservations",
      Number(
        summary.totalReservations ||
        0
      )
    );


    setText(
      "paidReservations",
      Number(
        summary.paidReservations ??
        summary.paid ??
        0
      )
    );


    setText(
      "approvedReservations",
      Number(
        summary.approvedReservations ??
        summary.approved ??
        0
      )
    );


    setText(
      "allocatedReservations",
      Number(
        summary.allocatedReservations ??
        summary.allocated ??
        0
      )
    );


  } catch (error) {

    console.error(error);

    showMessage(
      error.message ||
        "Unable to load dashboard.",
      "danger"
    );

  } finally {

    if (showSpinner) {
      showLoading(false);
    }

  }

}


// ==========================================================
// FILTER
// ==========================================================

function filterReservations() {

  const search =
    String(
      document.getElementById(
        "searchInput"
      )?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  const status =
    String(
      document.getElementById(
        "statusFilter"
      )?.value ||
      "All"
    )
      .trim()
      .toLowerCase();


  const filtered =
    allReservations.filter(
      function (reservation) {

        const reservationId =
          String(
            reservation.reservationId ||
            ""
          )
            .toLowerCase();


        const registrationCode =
          String(
            reservation.registrationCode ||
            ""
          )
            .toLowerCase();


        const participantName =
          String(
            reservation.participantName ||
            ""
          )
            .toLowerCase();


        const reservationStatus =
          String(
            reservation.status ||
            ""
          )
            .trim()
            .toLowerCase();


        const paymentStatus =
          String(
            reservation.paymentStatus ||
            ""
          )
            .trim()
            .toLowerCase();


        const approvalStatus =
          String(
            reservation.approvalStatus ||
            ""
          )
            .trim()
            .toLowerCase();


        const matchesSearch =
          !search ||
          reservationId.includes(search) ||
          registrationCode.includes(search) ||
          participantName.includes(search);


        const matchesStatus =
          status === "all" ||
          reservationStatus === status ||
          paymentStatus === status ||
          approvalStatus === status;


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
// RENDER TABLE
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


  if (
    !reservations ||
    !reservations.length
  ) {

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
              reservation.staffId ||
              ""
            )}
          </small>

        </td>


        <td>
          ${escapeHtml(
            reservation.roomType ||
            ""
          )}
        </td>


        <td>

          <strong>
            GH₵ ${Number(
              reservation.rate ||
              0
            ).toLocaleString(
              "en-GH",
              {
                minimumFractionDigits:
                  2
              }
            )}
          </strong>

          <br>

          <small class="text-muted">
            ${escapeHtml(
              reservation.rateType ||
              ""
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

          <div
            class="d-flex flex-wrap gap-1"
          >

            ${buildActionButton(
              reservation
            )}

            <button
              class="btn btn-sm btn-outline-secondary"
              onclick="viewReservation('${escapeJs(
                reservation.reservationId
              )}')"
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
// ACTION BUTTONS
// ==========================================================

function buildActionButton(
  reservation
) {

  const status =
    String(
      reservation.status ||
      ""
    )
      .trim()
      .toLowerCase();


  const paymentStatus =
    String(
      reservation.paymentStatus ||
      ""
    )
      .trim()
      .toLowerCase();


  const approvalStatus =
    String(
      reservation.approvalStatus ||
      ""
    )
      .trim()
      .toLowerCase();


  // --------------------------------------------------------
  // CANCELLED
  // --------------------------------------------------------

  if (
    status === "cancelled"
  ) {

    return `
      <span class="badge bg-danger">
        Cancelled
      </span>
    `;

  }


  // --------------------------------------------------------
  // ALLOCATED
  //
  // IMPORTANT FIX:
  // SHOW EDIT BUTTON.
  // --------------------------------------------------------

  if (
    status === "allocated"
  ) {

    return `
      <button
        class="btn btn-sm btn-warning"
        onclick="openAllocationModal(
          '${escapeJs(
            reservation.reservationId
          )}',
          'edit'
        )"
      >
        ✏️ Edit Allocation
      </button>
    `;

  }


  // --------------------------------------------------------
  // PAYMENT NOT DONE
  // --------------------------------------------------------

  if (
    paymentStatus !== "paid"
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
  // PAYMENT DONE BUT NOT APPROVED
  // --------------------------------------------------------

  if (
    approvalStatus !== "approved"
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
  // READY FOR ALLOCATION
  // --------------------------------------------------------

  return `
    <button
      class="btn btn-sm btn-primary"
      onclick="openAllocationModal(
        '${escapeJs(
          reservation.reservationId
        )}',
        'new'
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

  const value =
    String(
      status ||
      "Pending"
    )
      .trim()
      .toLowerCase();


  if (
    value === "paid"
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

  const value =
    String(
      status ||
      "Pending"
    )
      .trim()
      .toLowerCase();


  if (
    value === "approved"
  ) {

    return `
      <span class="badge bg-success">
        ✓ Approved
      </span>
    `;

  }


  if (
    value === "rejected"
  ) {

    return `
      <span class="badge bg-danger">
        Rejected
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

  const status =
    String(
      reservation.status ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    status === "allocated"
  ) {

    const block =
      reservation.blockName ||
      "";

    const room =
      reservation.roomNumber ||
      "";

    const bed =
      reservation.bedNumber ||
      "";


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
            ? "/" +
              escapeHtml(bed)
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
    referenceField.value =
      "";
  }


  const modal =
    document.getElementById(
      "paymentModal"
    );


  if (
    modal &&
    typeof bootstrap !==
      "undefined"
  ) {

    bootstrap.Modal
      .getOrCreateInstance(
        modal
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


  const reference =
    document.getElementById(
      "paymentReference"
    )?.value.trim();


  if (!reservationId) {

    showMessage(
      "Reservation ID is missing.",
      "danger"
    );

    return;

  }


  if (!reference) {

    showMessage(
      "Please enter the payment reference.",
      "warning"
    );

    return;

  }


  showLoading(true);


  try {

    const params =
      new URLSearchParams();


    params.set(
      "action",
      "verifyPayment"
    );


    params.set(
      "reservationId",
      reservationId
    );


    params.set(
      "paymentReference",
      reference
    );


    params.set(
      "paymentAmount",
      currentReservation?.rate ||
        ""
    );


    params.set(
      "paymentMethod",
      "Manual Verification"
    );


    params.set(
      "verifiedBy",
      CURRENT_USER
    );


    const result =
      await apiRequest(
        params
      );


    if (!result.success) {

      showMessage(
        result.message ||
          "Payment verification failed.",
        "danger"
      );

      return;

    }


    closeModal(
      "paymentModal"
    );


    showMessage(
      "Payment verified successfully.",
      "success"
    );


    await refreshAll(
      false
    );


  } catch (error) {

    console.error(error);

    showMessage(
      error.message ||
        "Unable to verify payment.",
      "danger"
    );

  } finally {

    showLoading(false);

  }

}


// ==========================================================
// APPROVE RESERVATION
// ==========================================================

async function approveReservation(
  reservationId
) {

  if (
    !confirm(
      "Approve this reservation?"
    )
  ) {

    return;

  }


  showLoading(true);


  try {

    const params =
      new URLSearchParams();


    params.set(
      "action",
      "approveReservation"
    );


    params.set(
      "reservationId",
      reservationId
    );


    params.set(
      "approvedBy",
      CURRENT_USER
    );


    const result =
      await apiRequest(
        params
      );


    if (!result.success) {

      showMessage(
        result.message ||
          "Approval failed.",
        "danger"
      );

      return;

    }


    showMessage(
      "Reservation approved successfully.",
      "success"
    );


    await refreshAll(
      false
    );


  } catch (error) {

    console.error(error);

    showMessage(
      error.message ||
        "Unable to approve reservation.",
      "danger"
    );

  } finally {

    showLoading(false);

  }

}


// ==========================================================
// RELEASE RESERVATION
// ==========================================================

async function releaseReservation(
  reservationId
) {

  if (
    !confirm(
      "Release this reservation because payment was not completed?"
    )
  ) {

    return;

  }


  showLoading(true);


  try {

    const params =
      new URLSearchParams();


    params.set(
      "action",
      "releaseReservation"
    );


    params.set(
      "reservationId",
      reservationId
    );


    params.set(
      "releasedBy",
      CURRENT_USER
    );


    const result =
      await apiRequest(
        params
      );


    if (!result.success) {

      showMessage(
        result.message ||
          "Unable to release reservation.",
        "danger"
      );

      return;

    }


    showMessage(
      "Reservation released successfully.",
      "success"
    );


    await refreshAll(
      false
    );


  } catch (error) {

    console.error(error);

    showMessage(
      error.message ||
        "Unable to release reservation.",
      "danger"
    );

  } finally {

    showLoading(false);

  }

}


// ==========================================================
// OPEN ALLOCATION MODAL
// ==========================================================

function openAllocationModal(
  reservationId,
  mode = "new"
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


  allocationMode =
    String(
      mode ||
      "new"
    )
      .toLowerCase();


  const idField =
    document.getElementById(
      "allocationReservationId"
    );


  const participantField =
    document.getElementById(
      "allocationParticipant"
    );


  const blockField =
    document.getElementById(
      "blockName"
    );


  const roomField =
    document.getElementById(
      "roomNumber"
    );


  const bedField =
    document.getElementById(
      "bedNumber"
    );


  if (idField) {
    idField.value =
      reservationId;
  }


  if (participantField) {

    participantField.value =
      (
        reservation.participantName ||
        ""
      ) +
      " (" +
      (
        reservation.registrationCode ||
        ""
      ) +
      ")";

  }


  if (blockField) {

    blockField.value =
      reservation.blockName ||
      "";

  }


  if (roomField) {

    roomField.value =
      reservation.roomNumber ||
      "";

  }


  if (bedField) {

    bedField.value =
      reservation.bedNumber ||
      "";

  }


  const message =
    document.getElementById(
      "allocationMessage"
    );


  if (message) {
    message.innerHTML = "";
  }


  const button =
    document.getElementById(
      "allocationSubmitButton"
    );


  if (button) {

    button.disabled =
      false;


    button.innerHTML =
      allocationMode ===
      "edit"
        ? "Save Changes"
        : "Save Allocation";

  }


  const modal =
    document.getElementById(
      "allocationModal"
    );


  if (
    modal &&
    typeof bootstrap !==
      "undefined"
  ) {

    bootstrap.Modal
      .getOrCreateInstance(
        modal
      )
      .show();

  }

}


// ==========================================================
// SUBMIT ALLOCATION
//
// NEW -> allocateRoom
// EDIT -> editAllocation
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


  const message =
    document.getElementById(
      "allocationMessage"
    );


  if (!reservationId) {

    showAllocationMessage(
      "Reservation ID is missing.",
      "danger"
    );

    return;

  }


  if (!blockName) {

    showAllocationMessage(
      "Please enter/select a block.",
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


  const isEdit =
    allocationMode ===
    "edit";


  if (
    !confirm(
      isEdit
        ? "Save these allocation changes?"
        : "Confirm this room allocation?"
    )
  ) {

    return;

  }


  const button =
    document.getElementById(
      "allocationSubmitButton"
    );


  if (button) {

    button.disabled =
      true;

    button.innerHTML =
      isEdit
        ? "Saving..."
        : "Allocating...";

  }


  showLoading(true);


  try {

    const params =
      new URLSearchParams();


    // ------------------------------------------------------
    // CRITICAL:
    // Correct backend action names.
    // ------------------------------------------------------

    const action =
      isEdit
        ? "editAllocation"
        : "allocateRoom";


    params.set(
      "action",
      action
    );


    params.set(
      "reservationId",
      reservationId
    );


    params.set(
      "blockName",
      blockName
    );


    params.set(
      "roomNumber",
      roomNumber
    );


    params.set(
      "bedNumber",
      bedNumber
    );


    // ------------------------------------------------------
    // CRITICAL:
    // Backend requires these.
    // ------------------------------------------------------

    if (isEdit) {

      params.set(
        "editedBy",
        CURRENT_USER
      );

    } else {

      params.set(
        "allocatedBy",
        CURRENT_USER
      );

    }


    const result =
      await apiRequest(
        params
      );


    if (!result.success) {

      showAllocationMessage(
        result.message ||
          "Allocation failed.",
        "danger"
      );

      return;

    }


    closeModal(
      "allocationModal"
    );


    showMessage(
      isEdit
        ? "Room allocation updated successfully."
        : "Room allocated successfully.",
      "success"
    );


    // ------------------------------------------------------
    // REFRESH BOTH.
    // ------------------------------------------------------

    await refreshAll(
      false
    );


  } catch (error) {

    console.error(error);


    showAllocationMessage(
      error.message ||
        "Unable to save room allocation.",
      "danger"
    );


  } finally {

    showLoading(false);


    if (button) {

      button.disabled =
        false;

      button.innerHTML =
        isEdit
          ? "Save Changes"
          : "Save Allocation";

    }

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
        <strong>Reservation ID</strong>
        <div>
          ${escapeHtml(
            reservation.reservationId
          )}
        </div>
      </div>


      <div class="col-md-6">
        <strong>Registration Code</strong>
        <div>
          ${escapeHtml(
            reservation.registrationCode
          )}
        </div>
      </div>


      <div class="col-md-6">
        <strong>Participant</strong>
        <div>
          ${escapeHtml(
            reservation.participantName
          )}
        </div>
      </div>


      <div class="col-md-6">
        <strong>Staff ID</strong>
        <div>
          ${escapeHtml(
            reservation.staffId ||
            ""
          )}
        </div>
      </div>


      <div class="col-md-6">
        <strong>Room Type</strong>
        <div>
          ${escapeHtml(
            reservation.roomType ||
            ""
          )}
        </div>
      </div>


      <div class="col-md-6">
        <strong>Rate</strong>
        <div>
          GH₵ ${Number(
            reservation.rate ||
            0
          ).toLocaleString(
            "en-GH",
            {
              minimumFractionDigits:
                2
            }
          )}
        </div>
      </div>


      <div class="col-md-4">
        <strong>Payment</strong>
        <div>
          ${paymentBadge(
            reservation.paymentStatus
          )}
        </div>
      </div>


      <div class="col-md-4">
        <strong>Approval</strong>
        <div>
          ${approvalBadge(
            reservation.approvalStatus
          )}
        </div>
      </div>


      <div class="col-md-4">
        <strong>Status</strong>
        <div>
          ${allocationBadge(
            reservation
          )}
        </div>
      </div>


      <div class="col-12">

        <hr>

        <h6>
          Room Allocation
        </h6>

        <div class="row">

          <div class="col-md-4">
            <strong>Block</strong>
            <div>
              ${escapeHtml(
                reservation.blockName ||
                "Not allocated"
              )}
            </div>
          </div>


          <div class="col-md-4">
            <strong>Room</strong>
            <div>
              ${escapeHtml(
                reservation.roomNumber ||
                "Not allocated"
              )}
            </div>
          </div>


          <div class="col-md-4">
            <strong>Bed</strong>
            <div>
              ${escapeHtml(
                reservation.bedNumber ||
                "Not allocated"
              )}
            </div>
          </div>

        </div>

      </div>

    </div>

  `;


  const modal =
    document.getElementById(
      "reservationModal"
    );


  if (
    modal &&
    typeof bootstrap !==
      "undefined"
  ) {

    bootstrap.Modal
      .getOrCreateInstance(
        modal
      )
      .show();

  }

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
        reservation.reservationId ||
        ""
      ) ===
      String(
        reservationId ||
        ""
      );

    }
  ) || null;

}


// ==========================================================
// API GET
// ==========================================================

async function apiGet(
  action
) {

  const url =
    API_URL +
    "?action=" +
    encodeURIComponent(
      action
    );


  const response =
    await fetch(
      url,
      {
        method: "GET",
        cache: "no-store"
      }
    );


  return parseApiResponse(
    response
  );

}


// ==========================================================
// API REQUEST
// ==========================================================

async function apiRequest(
  params
) {

  const url =
    API_URL +
    "?" +
    params.toString();


  const response =
    await fetch(
      url,
      {
        method: "GET",
        cache: "no-store"
      }
    );


  return parseApiResponse(
    response
  );

}


// ==========================================================
// PARSE API RESPONSE
// ==========================================================

async function parseApiResponse(
  response
) {

  const text =
    await response.text();


  if (!response.ok) {

    throw new Error(
      "Server returned HTTP " +
      response.status
    );

  }


  let result;


  try {

    result =
      JSON.parse(
        text
      );

  } catch (error) {

    console.error(
      "Invalid JSON response:",
      text
    );


    throw new Error(
      "The server returned an invalid response. Please make sure the latest Apps Script deployment is active."
    );

  }


  return result;

}


// ==========================================================
// SHOW ALLOCATION MESSAGE
// ==========================================================

function showAllocationMessage(
  message,
  type = "danger"
) {

  const element =
    document.getElementById(
      "allocationMessage"
    );


  if (!element) {
    return;
  }


  element.innerHTML = `

    <div
      class="alert alert-${escapeHtml(
        type
      )}"
      role="alert"
    >
      ${escapeHtml(
        message
      )}
    </div>

  `;

}


// ==========================================================
// SHOW GLOBAL MESSAGE
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
      class="alert alert-${escapeHtml(
        type
      )} alert-dismissible fade show"
      role="alert"
    >

      ${escapeHtml(
        message
      )}

      <button
        type="button"
        class="btn-close"
        data-bs-dismiss="alert"
      ></button>

    </div>

  `;

}


// ==========================================================
// CLOSE MODAL
// ==========================================================

function closeModal(
  id
) {

  const element =
    document.getElementById(
      id
    );


  if (
    element &&
    typeof bootstrap !==
      "undefined"
  ) {

    const modal =
      bootstrap.Modal
        .getInstance(
          element
        );


    if (modal) {

      modal.hide();

    } else {

      bootstrap.Modal
        .getOrCreateInstance(
          element
        )
        .hide();

    }

  }

}


// ==========================================================
// LOADING
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


  overlay.style.display =
    show
      ? "flex"
      : "none";

}


// ==========================================================
// SET TEXT
// ==========================================================

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value;

  }

}


// ==========================================================
// ESCAPE HTML
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
// ESCAPE JAVASCRIPT
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
// EXPORT CURRENT RESULTS
// ==========================================================

function exportCurrentResults() {

  const data =
    getFilteredReservations();


  downloadCsv(
    data,
    "SNMM_2026_Current_Results.csv"
  );

}


// ==========================================================
// EXPORT ALL
// ==========================================================

function exportAllReservations() {

  downloadCsv(
    allReservations,
    "SNMM_2026_All_Reservations.csv"
  );

}


// ==========================================================
// EXPORT BY STATUS
// ==========================================================

function exportByStatus(
  status
) {

  const value =
    String(
      status ||
      ""
    )
      .trim()
      .toLowerCase();


  const data =
    allReservations.filter(
      function (r) {

        return (
          String(
            r.status ||
            ""
          )
            .trim()
            .toLowerCase() ===
          value
        );

      }
    );


  downloadCsv(
    data,
    "SNMM_2026_" +
      status +
      ".csv"
  );

}


// ==========================================================
// EXPORT UNALLOCATED
// ==========================================================

function exportUnallocated() {

  const data =
    allReservations.filter(
      function (r) {

        const status =
          String(
            r.status ||
            ""
          )
            .trim()
            .toLowerCase();


        return (
          status !== "allocated" &&
          status !== "cancelled"
        );

      }
    );


  downloadCsv(
    data,
    "SNMM_2026_Unallocated.csv"
  );

}


// ==========================================================
// GET FILTERED
// ==========================================================

function getFilteredReservations() {

  const search =
    String(
      document.getElementById(
        "searchInput"
      )?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  const status =
    String(
      document.getElementById(
        "statusFilter"
      )?.value ||
      "All"
    )
      .trim()
      .toLowerCase();


  return allReservations.filter(
    function (reservation) {

      const reservationId =
        String(
          reservation.reservationId ||
          ""
        )
          .toLowerCase();


      const registrationCode =
        String(
          reservation.registrationCode ||
          ""
        )
          .toLowerCase();


      const participantName =
        String(
          reservation.participantName ||
          ""
        )
          .toLowerCase();


      const reservationStatus =
        String(
          reservation.status ||
          ""
        )
          .trim()
          .toLowerCase();


      const paymentStatus =
        String(
          reservation.paymentStatus ||
          ""
        )
          .trim()
          .toLowerCase();


      const approvalStatus =
        String(
          reservation.approvalStatus ||
          ""
        )
          .trim()
          .toLowerCase();


      const matchesSearch =
        !search ||
        reservationId.includes(
          search
        ) ||
        registrationCode.includes(
          search
        ) ||
        participantName.includes(
          search
        );


      const matchesStatus =
        status === "all" ||
        reservationStatus === status ||
        paymentStatus === status ||
        approvalStatus === status;


      return (
        matchesSearch &&
        matchesStatus
      );

    }
  );

}


// ==========================================================
// CSV
// ==========================================================

function downloadCsv(
  reservations,
  filename
) {

  if (
    !reservations ||
    !reservations.length
  ) {

    showMessage(
      "There is no data to export.",
      "warning"
    );

    return;

  }


  const headers = [
    "Reservation ID",
    "Registration Code",
    "Participant Name",
    "Staff ID",
    "Room Type",
    "Rate",
    "Rate Type",
    "Status",
    "Payment Status",
    "Approval Status",
    "Block",
    "Room",
    "Bed",
    "Payment Reference",
    "Payment Amount",
    "Payment Method",
    "Allocated By",
    "Allocated At"
  ];


  const rows =
    reservations.map(
      function (r) {

        return [
          r.reservationId,
          r.registrationCode,
          r.participantName,
          r.staffId,
          r.roomType,
          r.rate,
          r.rateType,
          r.status,
          r.paymentStatus,
          r.approvalStatus,
          r.blockName,
          r.roomNumber,
          r.bedNumber,
          r.paymentReference,
          r.paymentAmount,
          r.paymentMethod,
          r.allocatedBy,
          r.allocatedAt
        ];

      }
    );


  const csv =
    [
      headers,
      ...rows
    ]
      .map(
        row =>
          row
            .map(
              value =>
                '"' +
                String(
                  value ??
                  ""
                )
                  .replace(
                    /"/g,
                    '""'
                  ) +
                '"'
            )
            .join(",")
      )
      .join("\r\n");


  const blob =
    new Blob(
      [
        "\ufeff" +
        csv
      ],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;

  link.download =
    filename;


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  URL.revokeObjectURL(
    url
  );

}


// ==========================================================
// THEME
// ==========================================================

function initializeTheme() {

  const saved =
    localStorage.getItem(
      "snmmTheme"
    ) ||
    "light";


  document.documentElement
    .setAttribute(
      "data-bs-theme",
      saved
    );


  const toggle =
    document.getElementById(
      "themeToggle"
    );


  if (toggle) {

    toggle.checked =
      saved === "dark";


    toggle.addEventListener(
      "change",
      function () {

        const theme =
          toggle.checked
            ? "dark"
            : "light";


        document.documentElement
          .setAttribute(
            "data-bs-theme",
            theme
          );


        localStorage.setItem(
          "snmmTheme",
          theme
        );

      }
    );

  }

}