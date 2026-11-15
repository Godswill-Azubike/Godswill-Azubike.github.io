
const STORAGE_KEY = 'ga-planner-tasks';

// The list of tasks. Each task looks like:
// { id: 'abc123', title: 'Read chapter 4', course: 'Biology', due: '2026-11-20', priority: 'medium', done: false }
let tasks = [];
let currentFilter = 'all'; // 'all', 'active' or 'done'
let newTaskId = null;      // the task that was just added

/* ---------- Elements on the page ---------- */
const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const courseInput = document.getElementById('task-course');
const dueInput = document.getElementById('task-due');
const priorityInput = document.getElementById('task-priority');
const titleError = document.getElementById('task-title-error');

const list = document.getElementById('task-list');
const listHeading = document.getElementById('tasks-title');
const emptyMessage = document.getElementById('task-empty');
const statsText = document.getElementById('task-stats');
const percentText = document.getElementById('task-percent');
const progressBar = document.getElementById('task-progress');
const progressFill = document.getElementById('task-progress-fill');
const filterButtons = document.querySelectorAll('[data-filter]');
const clearDoneButton = document.getElementById('clear-done');

const EMPTY_MESSAGES = {
  all: 'Nothing here yet. Add your first task using the form.',
  active: 'Nothing left to do. Nice work!',
  done: 'No finished tasks yet.'
};

/* ---------- Saving and loading ---------- */
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Unable to save tasks:', error);
  }
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return null;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

/* ---------- Small helpers ---------- */
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Turns a Date into 'YYYY-MM-DD' using the local time zone
function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function daysFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

// Returns text like "Due 18 Nov", "Due today" or "Overdue · 12 Nov"
function describeDueDate(task) {
  if (!task.due) return null;

  const today = toDateString(new Date());
  const pretty = new Date(task.due + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  });

  if (task.due === today) return { text: 'Due today', overdue: false };
  if (task.due < today && !task.done) return { text: 'Overdue · ' + pretty, overdue: true };
  return { text: 'Due ' + pretty, overdue: false };
}

// A few example tasks so the planner isn't empty on the first visit
function sampleTasks() {
  return [
    { id: makeId(), title: 'Finish my portfolio website', course: 'Web Design', due: daysFromToday(3), priority: 'high', done: false },
    { id: makeId(), title: 'Read chapter 4 before the test', course: 'Data Structures', due: daysFromToday(6), priority: 'medium', done: false },
    { id: makeId(), title: 'Submit lab report', course: 'Physics', due: daysFromToday(-1), priority: 'low', done: true }
  ];
}

/* ---------- Actions ---------- */
function addTask(title, course, due, priority) {
  const id = makeId();
  tasks.push({
    id: id,
    title: title,
    course: course,
    due: due,
    priority: priority,
    done: false
  });
  saveTasks();

  // Draw the list with the new task sliding in, then forget it
  newTaskId = id;
  renderTasks();
  newTaskId = null;
}

function toggleTask(id) {
  const task = tasks.find(function (item) { return item.id === id; });
  if (!task) return;
  task.done = !task.done;
  saveTasks();
  renderTasks();

  // Keep keyboard focus on the same checkbox after the list is redrawn
  const checkbox = list.querySelector('[data-id="' + id + '"] .task__checkbox');
  if (checkbox) checkbox.focus();
}

function deleteTask(id) {
  tasks = tasks.filter(function (item) { return item.id !== id; });
  saveTasks();
  renderTasks();
  listHeading.focus();
}

function clearDone() {
  tasks = tasks.filter(function (item) { return !item.done; });
  saveTasks();
  renderTasks();
}

function setFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach(function (button) {
    button.classList.toggle('is-active', button.dataset.filter === filter);
  });
  renderTasks();
}

/* ---------- Drawing the list ---------- */
function getVisibleTasks() {
  const visible = tasks.filter(function (task) {
    if (currentFilter === 'active') return !task.done;
    if (currentFilter === 'done') return task.done;
    return true;
  });

  // Unfinished tasks first, then the soonest due date. Tasks with no date go last.
  return visible.slice().sort(function (a, b) {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.due && b.due) return a.due.localeCompare(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });
}

function createTaskItem(task) {
  const item = document.createElement('li');
  item.className = 'task';
  item.dataset.id = task.id;
  if (task.done) item.classList.add('is-done');
  if (task.id === newTaskId) item.classList.add('is-new');

  // Checkbox to mark the task as done
  const checkLabel = document.createElement('label');
  checkLabel.className = 'task__check';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task__checkbox';
  checkbox.checked = task.done;
  checkLabel.appendChild(checkbox);

  // Title and details
  const body = document.createElement('div');
  const title = document.createElement('p');
  title.className = 'task__title';
  title.textContent = task.title;

  const meta = document.createElement('p');
  meta.className = 'task__meta';

  if (task.course) {
    const course = document.createElement('span');
    course.textContent = task.course;
    meta.appendChild(course);
  }

  const due = describeDueDate(task);
  if (due) {
    const dueSpan = document.createElement('span');
    dueSpan.textContent = due.text;
    if (due.overdue) dueSpan.className = 'is-overdue';
    meta.appendChild(dueSpan);
  }

  const priority = document.createElement('span');
  priority.className = 'tag tag--' + task.priority;
  priority.textContent = task.priority;
  meta.appendChild(priority);

  body.appendChild(title);
  body.appendChild(meta);

  // Delete button
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'task__delete';
  deleteButton.textContent = '×';

  item.appendChild(checkLabel);
  item.appendChild(body);
  item.appendChild(deleteButton);
  return item;
}

function renderTasks() {
  const visible = getVisibleTasks();

  list.innerHTML = '';
  visible.forEach(function (task) {
    list.appendChild(createTaskItem(task));
  });

  emptyMessage.textContent = EMPTY_MESSAGES[currentFilter];
  emptyMessage.hidden = visible.length > 0;

  updateStats();
}

function updateStats() {
  const total = tasks.length;
  const doneCount = tasks.filter(function (task) { return task.done; }).length;
  const leftCount = total - doneCount;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  statsText.textContent = total === 0
    ? 'No tasks yet'
    : total + (total === 1 ? ' task' : ' tasks') + ' · ' + doneCount + ' done · ' + leftCount + ' to go';
  percentText.textContent = percent + '% done';

  progressFill.style.width = percent + '%';

  document.querySelector('[data-count="all"]').textContent = total;
  document.querySelector('[data-count="active"]').textContent = leftCount;
  document.querySelector('[data-count="done"]').textContent = doneCount;

  clearDoneButton.disabled = doneCount === 0;
}

/* ---------- Form validation ---------- */
function showTitleError(message) {
  titleError.textContent = message;
  titleInput.closest('.field').classList.toggle('has-error', message !== '');
}

/* ---------- Event handling ---------- */
form.addEventListener('submit', function (event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (title === '') {
    showTitleError('Please give the task a name.');
    titleInput.focus();
    return;
  }

  showTitleError('');
  addTask(title, courseInput.value.trim(), dueInput.value, priorityInput.value);

  form.reset();
  titleInput.focus();
});

titleInput.addEventListener('input', function () {
  if (titleInput.value.trim() !== '') showTitleError('');
});

// One listener for the whole list handles every task (event delegation)
list.addEventListener('change', function (event) {
  if (event.target.matches('.task__checkbox')) {
    toggleTask(event.target.closest('.task').dataset.id);
  }
});

list.addEventListener('click', function (event) {
  const deleteButton = event.target.closest('.task__delete');
  if (deleteButton) {
    deleteTask(deleteButton.closest('.task').dataset.id);
  }
});

filterButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    setFilter(button.dataset.filter);
  });
});

clearDoneButton.addEventListener('click', clearDone);

/* ---------- Start ---------- */
const savedTasks = loadTasks();
if (savedTasks === null) {
  tasks = sampleTasks();
  saveTasks();
} else {
  tasks = savedTasks;
}
renderTasks();
