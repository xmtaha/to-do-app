        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

        // Modal operations
        const modal = document.getElementById('taskModal');
        const taskForm = document.getElementById('taskForm');
        let currentTaskId = null;

        function openModal(taskId = null) {
            modal.style.display = 'block';
            if (taskId) {
                currentTaskId = taskId;
                const task = tasks.find(t => t.id === taskId);
                document.getElementById('modalTitle').textContent = 'Edit Task';
                document.getElementById('taskId').value = task.id;
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskCategory').value = task.category;
                document.getElementById('taskDueDate').value = task.dueDate;
                document.getElementById('taskPriority').value = task.priority;
                document.getElementById('taskDescription').value = task.description;
            } else {
                document.getElementById('modalTitle').textContent = 'New Task';
                taskForm.reset();
                currentTaskId = null;
            }
        }

        function closeModal() {
            modal.style.display = 'none';
            taskForm.reset();
            currentTaskId = null;
        }

        // Form submission
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const taskData = {
                id: currentTaskId || Date.now(),
                title: document.getElementById('taskTitle').value,
                category: document.getElementById('taskCategory').value,
                dueDate: document.getElementById('taskDueDate').value,
                priority: document.getElementById('taskPriority').value,
                description: document.getElementById('taskDescription').value,
                completed: false
            };

            if (currentTaskId) {
                const index = tasks.findIndex(t => t.id === currentTaskId);
                tasks[index] = { ...tasks[index], ...taskData };
            } else {
                tasks.push(taskData);
            }

            localStorage.setItem('tasks', JSON.stringify(tasks));
            closeModal();
            renderTasks();
            updateStats();
            updateChart();
            renderCalendar();
        });

        // Render tasks
        function renderTasks() {
            const taskList = document.getElementById('taskList');
            const filterCategory = document.getElementById('filterCategory').value;
            const searchText = document.getElementById('searchTask').value.toLowerCase();

            let filteredTasks = tasks;
            if (filterCategory !== 'all') {
                filteredTasks = filteredTasks.filter(task => task.category === filterCategory);
            }
            if (searchText) {
                filteredTasks = filteredTasks.filter(task => 
                    task.title.toLowerCase().includes(searchText) || 
                    task.description.toLowerCase().includes(searchText)
                );
            }

            taskList.innerHTML = filteredTasks.map(task => `
                <li class="flex justify-between items-center p-2 border-b ${task.completed ? 'bg-gray-100' : ''}">
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" ${task.completed ? 'checked' : ''}
                               onchange="toggleTaskComplete(${task.id})"
                               class="w-4 h-4 text-blue-600">
                        <div class="${task.completed ? 'line-through text-gray-500' : ''}">
                            <h3 class="font-bold">${task.title}</h3>
                            <p class="text-sm text-gray-600">Category: ${task.category}</p>
                            <p class="text-sm text-gray-600">Date: ${task.dueDate}</p>
                            <p class="text-sm text-gray-600">Priority: ${task.priority}</p>
                            <p class="text-sm text-gray-600">${task.description}</p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="openModal(${task.id})" 
                                class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteTask(${task.id})"
                                class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `).join('');
        }

        // Toggle task completion
        function toggleTaskComplete(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                localStorage.setItem('tasks', JSON.stringify(tasks));
                renderTasks();
                updateStats();
                updateChart();
                renderCalendar();
            }
        }

        // Delete task
        function deleteTask(taskId) {
            if (confirm('Are you sure you want to delete this task?')) {
                tasks = tasks.filter(task => task.id !== taskId);
                localStorage.setItem('tasks', JSON.stringify(tasks));
                renderTasks();
                updateStats();
                updateChart();
                renderCalendar();
            }
        }

        // Update stats
        function updateStats() {
            const completedTasks = tasks.filter(task => task.completed);
            const pendingTasks = tasks.filter(task => !task.completed);
            const today = new Date();
            const overdueTasks = tasks.filter(task => 
                !task.completed && new Date(task.dueDate) < today
            );

            document.getElementById('completedTaskCount').textContent = completedTasks.length;
            document.getElementById('pendingTaskCount').textContent = pendingTasks.length;
            document.getElementById('overdueTaskCount').textContent = overdueTasks.length;

            const completionRate = tasks.length > 0 
                ? Math.round((completedTasks.length / tasks.length) * 100)
                : 0;
            document.getElementById('completionRate').textContent = `${completionRate}%`;
            document.getElementById('completionProgress').style.width = `${completionRate}%`;
        }

        // Update chart
        function updateChart() {
            const completedTasks = tasks.filter(task => task.completed).length;
            const pendingTasks = tasks.filter(task => !task.completed).length;
            const overdueTasks = tasks.filter(task => 
                !task.completed && new Date(task.dueDate) < new Date()
            ).length;

            const ctx = document.getElementById('taskChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['✔️ Completed Tasks', '⏳ Pending Tasks', '⚠️ Overdue Tasks'],
                    datasets: [{
                        data: [completedTasks, pendingTasks, overdueTasks],
                        backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                }
            });
        }

        // Event listeners
        document.getElementById('addTaskBtn').addEventListener('click', () => openModal());
        document.getElementById('filterCategory').addEventListener('change', renderTasks);
        document.getElementById('searchTask').addEventListener('input', renderTasks);

        // Calendar operations
        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();

        function renderCalendar() {
            const calendar = document.getElementById('calendar');
            const currentDate = new Date(currentYear, currentMonth);
            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

            document.getElementById('currentMonthYear').textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            calendar.innerHTML = '';

            // Day names
            const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            dayNames.forEach(day => {
                const dayNameCell = document.createElement('div');
                dayNameCell.textContent = day;
                dayNameCell.classList.add('text-center', 'font-semibold', 'p-2');
                calendar.appendChild(dayNameCell);
            });

            // Empty cells
            for (let i = 0; i < firstDay; i++) {
                const emptyCell = document.createElement('div');
                calendar.appendChild(emptyCell);
            }

            // Day cells
            for (let day = 1; day <= daysInMonth; day++) {
                const dayCell = document.createElement('div');
                dayCell.textContent = day;
                dayCell.classList.add('text-center', 'p-2', 'border', 'rounded', 'hover:bg-gray-200', 'cursor-pointer');
                
                // Show tasks in day cells
                const tasksForDay = tasks.filter(task => new Date(task.dueDate).getDate() === day && new Date(task.dueDate).getMonth() === currentMonth && new Date(task.dueDate).getFullYear() === currentYear);
                if (tasksForDay.length > 0) {
                    const taskList = document.createElement('ul');
                    taskList.classList.add('text-xs', 'text-left', 'mt-1');
                    tasksForDay.forEach(task => {
                        const taskItem = document.createElement('li');
                        taskItem.textContent = task.title;
                        taskItem.classList.add('truncate');
                        taskList.appendChild(taskItem);
                    });
                    dayCell.appendChild(taskList);
                }

                dayCell.addEventListener('click', () => {
                    alert(`Selected date: ${day}/${currentMonth + 1}/${currentYear}`);
                });
                calendar.appendChild(dayCell);
            }
        }

        document.getElementById('prevMonth').addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
        // Render calendar on page load
        window.addEventListener('DOMContentLoaded', () => {
            renderCalendar();
            renderTasks();
            updateStats();
            updateChart();
        });
