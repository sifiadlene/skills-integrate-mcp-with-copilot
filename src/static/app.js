document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const categoryFilter = document.getElementById("category-filter");
  const nameFilter = document.getElementById("name-filter");
  const searchFilter = document.getElementById("search-filter");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "";
      nameFilter.innerHTML = '<option value="">All</option>';
      // Collect categories from activity names
      const categories = new Set();
      Object.entries(activities).forEach(([name, details]) => {
        // Guess category from name (first word or custom logic)
        let cat = name.split(" ")[0];
        categories.add(cat);
      });
      categoryFilter.innerHTML = '<option value="">All</option>' + Array.from(categories).map(cat => `<option value="${cat}">${cat}</option>`).join("");
      // Populate name filter
      Object.keys(activities).forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        nameFilter.appendChild(option);
      });
      // Populate activity select for signup
      Object.keys(activities).forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      // Filtering logic
      function filterActivities() {
        activitiesList.innerHTML = "";
        const selectedCategory = categoryFilter.value;
        const selectedName = nameFilter.value;
        const searchText = searchFilter.value.toLowerCase();
        Object.entries(activities).forEach(([name, details]) => {
          let cat = name.split(" ")[0];
          if (
            (selectedCategory === "" || cat === selectedCategory) &&
            (selectedName === "" || name === selectedName) &&
            (searchText === "" || name.toLowerCase().includes(searchText) || details.description.toLowerCase().includes(searchText))
          ) {
            const activityCard = document.createElement("div");
            activityCard.className = "activity-card";
            const spotsLeft = details.max_participants - details.participants.length;
            const participantsHTML =
              details.participants.length > 0
                ? `<div class="participants-section">
                  <h5>Participants:</h5>
                  <ul class="participants-list">
                    ${details.participants
                      .map(
                        (email) =>
                          `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                      )
                      .join("")}
                  </ul>
                </div>`
                : `<p><em>No participants yet</em></p>`;
            activityCard.innerHTML = `
              <h4>${name}</h4>
              <p>${details.description}</p>
              <p><strong>Schedule:</strong> ${details.schedule}</p>
              <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
              <div class="participants-container">
                ${participantsHTML}
              </div>
            `;
            activitiesList.appendChild(activityCard);
          }
        });
        // Add event listeners to delete buttons
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", handleUnregister);
        });
      }
      // Initial render
      filterActivities();
      // Add filter event listeners
      categoryFilter.addEventListener("change", filterActivities);
      nameFilter.addEventListener("change", filterActivities);
      searchFilter.addEventListener("input", filterActivities);

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
