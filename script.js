class TodoApp {
  constructor() {
    this.tasks = [];
    this.currentSelectedTaskId = null;
    this.isSelectingFromFinished = false;
    this.isModalOpen = false;

    this.taskInput = document.getElementById("taskInput");
    this.addTaskBtn = document.getElementById("addTaskBtn");
    this.todoList = document.getElementById("todoList");
    this.finishedList = document.getElementById("finishedList");
    this.editModal = document.getElementById("editModal");
    this.editTaskInput = document.getElementById("editTaskInput");
    this.saveEditBtn = document.getElementById("saveEditBtn");
    this.cancelEditBtn = document.getElementById("cancelEditBtn");
    this.closeBtn = document.querySelector(".close");

    this.bindEvents();
    this.loadTasks();
    this.renderTasks();
  }

  bindEvents() {
    this.addTaskBtn.addEventListener("click", () => this.addTask());

    this.taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.addTask();
      }
    });

    this.taskInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.taskInput.value = "";
        this.taskInput.blur();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "/") {
        e.preventDefault(); // prevent default browser behavior for "/"
        if (this.isModalOpen) {
          this.editTaskInput.focus();
        } else {
          this.taskInput.focus();
        }
      }
    });

    // navigate tasks through arrow keys
    document.addEventListener("keydown", (e) => {
      if (this.isModalOpen) return;

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        this.isSelectingFromFinished = !this.isSelectingFromFinished;
        this.selectNextTask(1);
        this.renderTasks();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (this.isModalOpen) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        this.selectNextTask(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        this.selectNextTask(1);
      }
    });

    // task selection events
    // toggle task
    document.addEventListener("keydown", (e) => {
      if (e.key === " " && this.currentSelectedTaskId && !this.isModalOpen) {
        e.preventDefault();
        this.toggleTask(this.currentSelectedTaskId);
      }
    });
    // edit task
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "e" && this.currentSelectedTaskId) {
        e.preventDefault();
        this.editTask(this.currentSelectedTaskId);
      }
    });
    // delete task
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "d" && this.currentSelectedTaskId) {
        e.preventDefault();
        this.deleteTask(this.currentSelectedTaskId);
      }
    });

    // modal events
    this.saveEditBtn.addEventListener("click", () => this.saveEdit());
    this.cancelEditBtn.addEventListener("click", () => this.closeModal());
    this.closeBtn.addEventListener("click", () => this.closeModal());

    // close modal when clicking outside
    this.editModal.addEventListener("click", (e) => {
      if (e.target === this.editModal) {
        this.closeModal();
      }
    });

    this.editTaskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.saveEdit();
      }
    });

    this.editTaskInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
      }
    });
  }

  // unique ID for tasks
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  selectNextTask(num) {
    let currentTasks = [];
    if (this.isSelectingFromFinished) {
      currentTasks = this.tasks.filter((task) => task.completed);
    } else {
      currentTasks = this.tasks.filter((task) => !task.completed);
    }
    const currentIndex = currentTasks.findIndex(
      (task) => task.id === this.currentSelectedTaskId
    );
    const previousIndex =
      (currentIndex + num + currentTasks.length) % currentTasks.length;
    this.currentSelectedTaskId = currentTasks[previousIndex].id;
    this.renderTasks();
  }

  addTask() {
    const taskText = this.taskInput.value.trim();

    if (taskText === "") {
      alert("Please enter a task!");
      return;
    }

    const newTask = {
      id: this.generateId(),
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.tasks.push(newTask);
    this.taskInput.value = "";
    // to keep focus on input
    this.taskInput.focus();

    this.saveTasks();
    this.renderTasks();

    this.showNotification("Task added successfully!", "success");
  }

  toggleTask(taskId) {
    const task = this.tasks.find((task) => task.id === taskId);

    if (task) {
      task.completed = !task.completed;
      this.isSelectingFromFinished = !this.isSelectingFromFinished;

      if (task.completed) {
        task.completedAt = new Date().toISOString();
        this.showNotification("Task completed!", "success");
      } else {
        delete task.completedAt;
        this.showNotification("Task moved back to todo!", "info");
      }

      this.saveTasks();
      this.renderTasks();
    }
  }

  deleteTask(taskId) {
    if (confirm("Are you sure you want to delete this task?")) {
      this.tasks = this.tasks.filter((task) => task.id !== taskId);

      this.saveTasks();
      this.renderTasks();
      this.showNotification("Task deleted!", "error");
    }
  }

  editTask(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);

    if (task) {
      this.isModalOpen = true;
      this.currentSelectedTaskId = taskId;
      this.editTaskInput.value = task.text;
      this.editModal.style.display = "block"; // instead of none
      this.editTaskInput.focus();
      this.editTaskInput.select();
    }
  }

  // save button
  saveEdit() {
    const newText = this.editTaskInput.value.trim();

    if (newText === "") {
      this.showNotification("Task text cannot be empty!", "error");
      return;
    }

    // find and update task
    const task = this.tasks.find(
      (task) => task.id === this.currentSelectedTaskId
    );
    if (task) {
      task.text = newText;
      task.updatedAt = new Date().toISOString();
    }

    this.closeModal();
    this.saveTasks();
    this.renderTasks();
    this.showNotification("Task updated!", "success");
  }

  closeModal() {
    this.isModalOpen = false;
    this.editModal.style.display = "none";
    this.editTaskInput.value = "";
  }

  renderTasks() {
    this.renderTodoTasks();
    this.renderFinishedTasks();
  }

  renderTodoTasks() {
    this.todoList.innerHTML = "";

    const todoTasks = this.tasks.filter((task) => !task.completed);

    if (todoTasks.length === 0) {
      this.todoList.innerHTML =
        '<div class="empty-message">No todo tasks. Add a new task above!</div>';
      return;
    }

    todoTasks.forEach((task) => {
      const taskElement = this.createTaskElement(task, false);
      this.todoList.appendChild(taskElement);
    });
  }

  renderFinishedTasks() {
    this.finishedList.innerHTML = "";

    const finishedTasks = this.tasks.filter((task) => task.completed);

    if (finishedTasks.length === 0) {
      this.finishedList.innerHTML =
        '<div class="empty-message">No finished tasks yet.</div>';
      return;
    }

    finishedTasks.forEach((task) => {
      const taskElement = this.createTaskElement(task, true);
      this.finishedList.appendChild(taskElement);
    });
  }

  createTaskElement(task, isFinished) {
    const li = document.createElement("li");
    li.className = `task-item ${isFinished ? "finished" : "not-finished"} ${
      this.currentSelectedTaskId === task.id ? "selected" : "not-selected"
    }`;

    li.innerHTML = `
            <div class="task-content">
                <input type="checkbox" class="task-checkbox" ${
                  isFinished ? "checked" : ""
                }>
                <span class="task-text ${isFinished ? "completed" : ""}">${
      task.text
    }</span>
            </div>
            <div class="task-actions">
                <button class="btn btn-edit" onclick="todoApp.editTask('${
                  task.id
                }')">Edit</button>
                <button class="btn btn-delete" onclick="todoApp.deleteTask('${
                  task.id
                }')">Delete</button>
            </div>
        `;

    const checkbox = li.querySelector(".task-checkbox");
    checkbox.addEventListener("change", () => {
      this.toggleTask(task.id);
    });

    return li;
  }

  showNotification(message, type = "info") {
    // remove existing notifications
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1001;
        `;

    switch (type) {
      case "success":
        notification.style.backgroundColor = "#28a745";
        break;
      case "error":
        notification.style.backgroundColor = "#dc3545";
        break;
      case "info":
        notification.style.backgroundColor = "#17a2b8";
        break;
      default:
        notification.style.backgroundColor = "#6c757d";
    }

    document.body.appendChild(notification);

    // remove notification after 2 seconds
    setTimeout(() => {
      notification.remove();
    }, 2000);
  }

  saveTasks() {
    const data = {
      tasks: this.tasks,
      lastSaved: new Date().toISOString(),
    };

    try {
      localStorage.setItem("todoAppData", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving tasks to localStorage:", error);
      this.showNotification("Error saving tasks!", "error");
    }
  }

  loadTasks() {
    try {
      const data = localStorage.getItem("todoAppData");
      if (data) {
        const parsedData = JSON.parse(data);
        this.tasks = parsedData.tasks || [];
      }
    } catch (error) {
      console.error("Error loading tasks from localStorage:", error);
      this.showNotification("Error loading saved tasks!", "error");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.todoApp = new TodoApp();
});
