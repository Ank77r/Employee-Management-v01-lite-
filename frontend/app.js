// UPDATE THIS URL AFTER DEPLOYMENT
const API_URL = "http://127.0.0.1:8000"; 

let currentEmpId = null;

// --- UI Helpers ---
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'} mr-2"></i> ${msg}`;
    toast.className = `fixed top-5 right-5 px-6 py-4 rounded shadow-lg text-white font-semibold transition-opacity duration-300 z-50 ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function setLoading(isLoading) {
    document.getElementById('loading').classList.toggle('hidden', !isLoading);
    document.getElementById('empTable').classList.toggle('hidden', isLoading);
    document.getElementById('emptyState').classList.toggle('hidden', true);
}

// --- API Calls ---

async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/stats`);
        const data = await res.json();
        document.getElementById('statTotal').innerText = data.total_employees;
        document.getElementById('statPresent').innerText = data.present_today;
    } catch (err) {
        console.error("Error loading stats", err);
    }
}

async function fetchEmployees() {
    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/employees/`);
        if (!res.ok) throw new Error("Failed to fetch");
        const employees = await res.json();
        
        const tbody = document.getElementById('empBody');
        tbody.innerHTML = '';

        if (employees.length === 0) {
            document.getElementById('emptyState').classList.remove('hidden');
            document.getElementById('empTable').classList.add('hidden');
        } else {
            document.getElementById('empTable').classList.remove('hidden');
            employees.forEach(emp => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${emp.employee_id}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${emp.full_name}</div>
                        <div class="text-sm text-gray-500">${emp.email}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            ${emp.department}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="openAttModal('${emp.employee_id}', '${emp.full_name}')" class="text-indigo-600 hover:text-indigo-900 mr-4 font-bold">Attendance</button>
                        <button onclick="deleteEmployee('${emp.employee_id}')" class="text-red-600 hover:text-red-900 font-bold">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        loadStats(); // Refresh stats whenever list updates
    } catch (err) {
        showToast("Error loading employees", "error");
    } finally {
        setLoading(false);
    }
}

async function addEmployee() {
    const data = {
        employee_id: document.getElementById('empId').value,
        full_name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        department: document.getElementById('dept').value
    };

    try {
        const res = await fetch(`${API_URL}/employees/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || "Error adding employee");
        }

        showToast("Employee added successfully!");
        document.getElementById('addEmpForm').reset();
        fetchEmployees();
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function deleteEmployee(id) {
    if(!confirm("Are you sure you want to delete this employee? This will also delete their attendance history.")) return;
    
    try {
        const res = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
        if(!res.ok) throw new Error("Failed to delete");
        showToast("Employee deleted");
        fetchEmployees();
    } catch (err) {
        showToast(err.message, "error");
    }
}

// --- Modal Logic ---

async function openAttModal(id, name) {
    currentEmpId = id;
    document.getElementById('modalTitle').innerText = `Attendance: ${name}`;
    document.getElementById('attModal').classList.remove('hidden');
    document.getElementById('attDate').valueAsDate = new Date();
    
    // Reset History Filter
    document.getElementById('historyFilterDate').value = "";
    
    fetchHistory();
}

async function fetchHistory() {
    const list = document.getElementById('attHistory');
    const dateFilter = document.getElementById('historyFilterDate').value;
    
    list.innerHTML = '<li class="text-gray-400 text-center py-2"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</li>';

    let url = `${API_URL}/attendance/${currentEmpId}`;
    if (dateFilter) url += `?filter_date=${dateFilter}`;

    try {
        const res = await fetch(url);
        const records = await res.json();
        list.innerHTML = '';
        
        if(records.length === 0) {
            list.innerHTML = '<li class="text-gray-400 text-center py-2">No records found</li>';
        } else {
            records.forEach(r => {
                const color = r.status === 'Present' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
                list.innerHTML += `
                    <li class="flex justify-between items-center border-b py-2 px-2 hover:bg-gray-50 rounded">
                        <span class="text-gray-600 font-mono">${r.date}</span> 
                        <span class="${color} px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">${r.status}</span>
                    </li>`;
            });
        }
    } catch(err) {
        list.innerHTML = '<li class="text-red-500">Error loading history</li>';
    }
}

function filterHistory() {
    fetchHistory();
}

function closeModal() {
    document.getElementById('attModal').classList.add('hidden');
}

async function submitAttendance() {
    const status = document.querySelector('input[name="status"]:checked').value;
    const date = document.getElementById('attDate').value;

    try {
        const res = await fetch(`${API_URL}/attendance/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: date,
                status: status,
                employee_id_str: currentEmpId
            })
        });
        
        if(!res.ok) throw new Error("Failed to mark attendance");
        
        showToast("Attendance Saved");
        // Refresh stats and history
        loadStats();
        fetchHistory();
    } catch (err) {
        showToast(err.message, "error");
    }
}

// Initial Load
fetchEmployees();