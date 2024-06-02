const removeSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
</svg>`;
const completeSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16">

  <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"/>
</svg>`;

function TodoApp() {
  this.data = JSON.parse(localStorage.getItem('todoList')) || {};
  this.selectedDate = new Date().toLocaleDateString();
  this.data[this.selectedDate] = this.data[this.selectedDate] || { todo: [], completed: [] };
  this.init();
}

TodoApp.prototype.init = function () {
  document.getElementById('add').addEventListener('click', () => {
    const itemValue = document.getElementById('item').value;
    const taskTime = document.getElementById('task-time').value;
    const taskDuration = document.getElementById('task-duration').value;
    if (itemValue && taskTime && taskDuration) {
      if (!this.isOverlapping(taskTime, taskDuration, this.selectedDate)) {
        this.addItem(itemValue, taskTime, taskDuration, this.selectedDate);
      } else {
        this.showAlert('Task overlaps with an existing task.');
      }
    }
  });

  document.getElementById('item').addEventListener('keydown', (e) => {
    const taskTime = document.getElementById('task-time').value;
    const taskDuration = document.getElementById('task-duration').value;
    if ((e.code === 'Enter' || e.code === 'NumpadEnter') && e.target.value && taskTime && taskDuration) {
      if (!this.isOverlapping(taskTime, taskDuration)) {
        this.addItem(e.target.value, taskTime, taskDuration);
      } else {
        alert('Task overlaps with an existing task.');
      }
    }
  });

  document.getElementById('view-date').addEventListener('change', (e) => {
    this.selectedDate = new Date(e.target.value).toLocaleDateString();
    this.updateCurrentDateDisplay();
    this.renderTodoList(new Date(e.target.value).toLocaleDateString());
  });

  this.renderTodoList();
};

TodoApp.prototype.isOverlapping = function (time, duration, pickedDate = new Date().toLocaleDateString()) {

  const tasks = this.data[pickedDate].todo.concat(this.data[pickedDate].completed);
  const startTime = this.parseTime(time);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  for (const task of tasks) {
    if (!task.time || !task.duration) continue; // Skip tasks with invalid time or duration
    const taskStartTime = this.parseTime(task.time);
    const taskEndTime = new Date(taskStartTime.getTime() + task.duration * 60000);

    if ((startTime >= taskStartTime && startTime < taskEndTime) ||
      (endTime > taskStartTime && endTime <= taskEndTime)) {
      return true;
    }
  }
  return false;
};

TodoApp.prototype.parseTime = function (timeString) {
  if (!timeString) {
    throw new Error('Invalid time string');
  }
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error('Invalid time format');
  }
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

TodoApp.prototype.addItem = function (value, time, duration, date = new Date().toLocaleDateString()) {
  const trimmedValue = value.trim();
  if (trimmedValue && time && duration) {
    const task = { value: trimmedValue, time: time, duration: duration, completed: false };
    this.data[date].todo.push(task);
    this.updateLocalStorage();
    this.renderTodoList(date);
    document.getElementById('item').value = '';
    document.getElementById('task-time').value = '';
    document.getElementById('task-duration').value = '';
  }
};

TodoApp.prototype.updateCurrentDateDisplay = function () {
  const date = this.selectedDate ? new Date(this.selectedDate) : new Date();
  //if selected date is not today
  if (this.selectedDate !== new Date().toLocaleDateString()) {
    this.showAlert(`Selected Date: ${date.toLocaleDateString()}`, 'info');
  } else {
    this.showAlert('', 'hide');
  }
};

TodoApp.prototype.renderTodoList = function (date = new Date().toLocaleDateString()) {
  const todoContainer = document.getElementById('todo-slots');
  const completedContainer = document.getElementById('completed-slots');
  const timelineContainer = document.getElementById('timeline');
  todoContainer.innerHTML = '';
  completedContainer.innerHTML = '';
  timelineContainer.innerHTML = '';

  if (!this.data[date]) {
    this.data[date] = { todo: [], completed: [] };
  }

  const tasks = this.data[date].todo.concat(this.data[date].completed).filter(task => task.time && task.duration).sort((a, b) => a.time.localeCompare(b.time));

  tasks.forEach(task => {
    const container = task.completed ? completedContainer : todoContainer;
    const timeSlot = document.createElement('li');
    timeSlot.classList.add('time-slot');

    const taskContent = document.createElement('div');
    taskContent.classList.add('task-content');
    taskContent.textContent = task.value;
    timeSlot.appendChild(taskContent);

    const buttons = document.createElement('div');
    buttons.classList.add('buttons');

    const removeButton = document.createElement('button');
    removeButton.innerHTML = removeSVG;
    removeButton.classList.add('remove');
    removeButton.addEventListener('click', (event) => this.removeItem(event, date, task));

    const completeButton = document.createElement('button');
    completeButton.innerHTML = completeSVG;
    completeButton.classList.add('complete');
    completeButton.classList.toggle('completed', task.completed);
    completeButton.addEventListener('click', (event) => this.completeItem(event, date, task));


    buttons.appendChild(removeButton);
    buttons.appendChild(completeButton);
    timeSlot.appendChild(buttons);

    if (!task.completed) {
      const timeLineNumber = document.createElement('span');
      timeLineNumber.classList.add('number');

      const timeLineNumberStartTime = document.createElement('span');
      timeLineNumberStartTime.textContent = task.time;
      timeLineNumber.appendChild(timeLineNumberStartTime);

      const timeLineNumberEndTime = document.createElement('span');
      timeLineNumberEndTime.textContent = this.calculateEndTime(task.time, task.duration);
      timeLineNumber.appendChild(timeLineNumberEndTime);


      timelineContainer.appendChild(timeSlot);
      timeSlot.appendChild(timeLineNumber);
    } else {
      completedContainer.appendChild(timeSlot);
    }
  });
};

TodoApp.prototype.calculateEndTime = function (startTime, duration) {
  const start = this.parseTime(startTime);
  const end = new Date(start.getTime() + duration * 60000);
  return end.toTimeString().split(' ')[0].slice(0, 5);
};

TodoApp.prototype.updateLocalStorage = function () {
  localStorage.setItem('todoList', JSON.stringify(this.data));
};

TodoApp.prototype.removeItem = function (event, date, task) {
  const item = event.target.closest('.time-slot');
  const listId = task.completed ? 'completed' : 'todo';

  this.data[date][listId] = this.data[date][listId].filter(t => t !== task);
  this.updateLocalStorage();

  item.parentNode.removeChild(item);
  this.renderTodoList(date);
};

TodoApp.prototype.completeItem = function (event, date, task) {
  const item = event.target.closest('.time-slot');
  const listId = task.completed ? 'completed' : 'todo';

  this.data[date][listId] = this.data[date][listId].filter(t => t !== task);
  task.completed = !task.completed;
  const newListId = task.completed ? 'completed' : 'todo';
  this.data[date][newListId].push(task);
  this.updateLocalStorage();

  item.parentNode.removeChild(item);
  this.renderTodoList(date);
};

// Custom Alert Function
TodoApp.prototype.showAlert = function (message, type = 'error') {
  const alertBox = document.getElementById('alert-box');
  if (type === 'hide') {
    alertBox.style.display = 'none';
    return;
  }
  alertBox.classList.add(type);
  const alertMessage = document.getElementById('alert-message');
  const close = document.getElementById('close-button');
  alertMessage.textContent = message;
  alertBox.classList.add('show');
  document.addEventListener('click', (e) => {
    if (e.target === close) {
      alertBox.classList.remove('show');
    }
  });
};


// Initialize the app
document.addEventListener('DOMContentLoaded', () => new TodoApp());
