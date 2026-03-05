import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Code2, Clock } from 'lucide-react';
import { api } from './api';
import { vamosAlert, vamosConfirm } from './utils/dialog';

export default function Employees() {
    const [activeTab, setActiveTab] = useState('list');

    const [employees, setEmployees] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [empForm, setEmpForm] = useState({ id: '', name: '', position: '', salary: 0 });

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch employees');
            setEmployees([]);
        }
    };

    const fetchAttendance = async () => {
        try {
            const res = await api.get('/attendance/daily');
            setAttendance(res.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch daily attendance');
            setAttendance([]);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchEmployees(), fetchAttendance()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const saveEmployee = async () => {
        if (!empForm.name || !empForm.position) {
            vamosAlert('Name and Position are required');
            return;
        }
        try {
            const { id, ...payload } = empForm;
            if (isEditing) {
                await api.put(`/employees/${id}`, payload);
            } else {
                await api.post('/employees', payload);
            }
            setIsEmpModalOpen(false);
            fetchEmployees();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to save employee data');
        }
    };

    const deleteEmployee = async (id: string) => {
        if (!(await vamosConfirm('Are you sure you want to terminate this employee?'))) return;
        try {
            await api.delete(`/employees/${id}`);
            fetchEmployees();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Failed to terminate employee');
        }
    };

    const clockIn = async (employeeId: string) => {
        try {
            await api.post('/attendance/checkin', { employeeId });
            fetchAttendance();
        } catch (err: any) {
            vamosAlert(err.response?.data?.message || 'Error checking in');
        }
    };

    const clockOut = async (attendanceId: string) => {
        try {
            await api.put(`/attendance/checkout/${attendanceId}`, {});
            fetchAttendance();
        } catch (err: any) {
            vamosAlert('Error checking out');
        }
    };

    if (loading) return <div className="p-8"><div className="animate-spin text-gray-500 w-8 h-8 rounded-full border-4 border-t-[#00ff66]"></div></div>;

    return (
        <div className="fade-in">

            <div className="flex space-x-4 mb-8">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'list' ? 'bg-[#00ff66] text-[#0a0a0a]' : 'bg-[#141414] text-gray-400 hover:text-white border border-[#222222]'}`}
                >
                    Staff List
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'attendance' ? 'bg-[#00ff66] text-[#0a0a0a]' : 'bg-[#141414] text-gray-400 hover:text-white border border-[#222222]'}`}
                >
                    Daily Attendance
                </button>
            </div>

            {activeTab === 'list' && (
                <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center">
                            <Users className="w-5 h-5 mr-2 text-[#00aaff]" />
                            Registered Staff
                        </h2>
                        <button onClick={() => { setIsEditing(false); setEmpForm({ id: '', name: '', position: 'Waitress', salary: 0 }); setIsEmpModalOpen(true); }} className="bg-[#0a0a0a] border border-[#00ff66]/40 text-[#00ff66] px-4 py-2 rounded-xl flex items-center font-bold hover:bg-[#00ff66] hover:text-[#0a0a0a] transition-all text-sm">
                            <Plus className="w-4 h-4 mr-2" /> Add Employee
                        </button>
                    </div>

                    <table className="w-full text-left">
                        <thead className="text-xs uppercase font-semibold tracking-wider text-gray-500 bg-[#0a0a0a]">
                            <tr>
                                <th className="p-4 rounded-tl-lg">Name</th>
                                <th className="p-4">Position</th>
                                <th className="p-4">Base Salary</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 rounded-tr-lg">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222222]">
                            {employees.map(emp => (
                                <tr key={emp.id} className="hover:bg-[#0a0a0a]/50 transition-colors">
                                    <td className="p-4 font-bold">{emp.name}</td>
                                    <td className="p-4 text-gray-300">{emp.position}</td>
                                    <td className="p-4 text-gray-300">Rp {emp.salary.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-[10px] rounded border font-bold ${emp.status === 'ACTIVE' ? 'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>{emp.status}</span>
                                    </td>
                                    <td className="p-4 flex space-x-2">
                                        <button onClick={() => {
                                            setEmpForm({ id: emp.id, name: emp.name, position: emp.position, salary: emp.salary });
                                            setIsEditing(true);
                                            setIsEmpModalOpen(true);
                                        }} className="text-[#00aaff] bg-[#00aaff]/10 p-2 rounded hover:bg-[#00aaff] hover:text-[#0a0a0a] transition-colors"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => deleteEmployee(emp.id)} className="text-[#ff3333] bg-[#ff3333]/10 p-2 rounded hover:bg-[#ff3333] hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        <button onClick={() => clockIn(emp.id)} className="text-[#00ff66] bg-[#00ff66]/10 p-2 rounded hover:bg-[#00ff66] hover:text-[#0a0a0a] transition-colors" title="Quick Clock In"><Clock className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6">
                    <h2 className="text-xl font-bold flex items-center mb-6">
                        <Code2 className="w-5 h-5 mr-2 text-[#bb00ff]" />
                        Today's Real-Time Log
                    </h2>
                    <table className="w-full text-left">
                        <thead className="text-xs uppercase font-semibold tracking-wider text-gray-500 bg-[#0a0a0a]">
                            <tr>
                                <th className="p-4 rounded-tl-lg">Staff</th>
                                <th className="p-4">Position</th>
                                <th className="p-4">Check In</th>
                                <th className="p-4">Check Out</th>
                                <th className="p-4 rounded-tr-lg">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222222]">
                            {attendance.map(log => (
                                <tr key={log.id} className="hover:bg-[#0a0a0a]/50 transition-colors">
                                    <td className="p-4 font-bold">{log.employeeName}</td>
                                    <td className="p-4 text-gray-300">{log.position}</td>
                                    <td className="p-4 text-[#00ff66] font-mono">{new Date(log.checkIn).toLocaleTimeString()}</td>
                                    <td className="p-4 font-mono">{log.checkOut ? new Date(log.checkOut).toLocaleTimeString() : <span className="text-orange-500 animate-pulse">On Duty</span>}</td>
                                    <td className="p-4">
                                        {!log.checkOut && (
                                            <button onClick={() => clockOut(log.id)} className="bg-[#ff9900]/10 text-[#ff9900] border border-[#ff9900]/30 px-3 py-1 text-xs rounded font-bold hover:bg-[#ff9900] hover:text-[#0a0a0a] transition-colors">
                                                Clock Out
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isEmpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#141414] border border-[#222222] p-8 rounded-2xl w-[400px]">
                        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Employee' : 'New Employee'}</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Full Name" value={empForm.name} onChange={e => setEmpForm(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-2 focus:outline-none focus:border-[#00ff66]" />
                            <select value={empForm.position} onChange={e => setEmpForm(prev => ({ ...prev, position: e.target.value }))} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-2 focus:outline-none focus:border-[#00ff66]">
                                <option value="" disabled>Select Position...</option>
                                <option value="Waitress">Waitress</option>
                                <option value="Technician">Table/Stick Technician</option>
                                <option value="Cleaner">OB / Cleaner</option>
                                <option value="Kitchen">Kitchen Staff</option>
                            </select>
                            <input type="number" placeholder="Base Salary (Rp)" value={empForm.salary || ''} onChange={e => setEmpForm(prev => ({ ...prev, salary: parseInt(e.target.value) || 0 }))} className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg px-4 py-2 focus:outline-none focus:border-[#00ff66]" />
                        </div>
                        <div className="flex space-x-4 mt-6">
                            <button onClick={() => setIsEmpModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl text-gray-500 font-bold hover:bg-[#222222] transition-colors">Cancel</button>
                            <button onClick={saveEmployee} className="flex-1 px-4 py-2 bg-[#00ff66] text-[#0a0a0a] rounded-xl font-bold hover:bg-[#00e65c] transition-colors shadow-[0_0_15px_rgba(0,255,102,0.3)]">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
