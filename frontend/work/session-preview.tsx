import { createRoot } from 'react-dom/client'
import SessionView from '../src/components/dashboard/SessionView'
import DashboardShell from '../src/components/dashboard/DashboardShell'
import { dashboardService as service } from '../src/services/dashboardService'
import type { SessionDetails } from '../src/types/dashboard'
import '../src/index.css'
import '../src/components/dashboard/TrainingPage.css'

const session: SessionDetails = { id: 999, strengthPlanId: 1, strengthWorkoutDayId: 1, startedAt: '2026-10-05T12:00:00Z', finishedAt:null, status:0, isCompleted:false, exercises:['Agachamento livre','Supino reto com barra','Remada curvada'].map((exerciseName,index) => ({id:index+1,plannedExerciseId:index+1,exerciseName,order:index+1,targetSets:3,minReps:8,maxReps:12,targetRir:2,notes:null,sets:[],isCompleted:false,completedAt:null})) }
if (location.search.includes('empty')) session.exercises=[]
service.session = async () => { await new Promise(resolve=>setTimeout(resolve,150)); return structuredClone(session) }
service.previousPerformance = async () => session.exercises.map(exercise=>({workoutExerciseId:exercise.id,exerciseName:exercise.exerciseName,previousSessionStartedAt:'2026-10-01T12:00:00Z',sets:[1,2,3].map(setNumber=>({setNumber,weight:40,reps:10,rir:2,rpe:8}))}))
service.addSet = async (id,input) => { const exercise=session.exercises.find(item=>item.id===id)!; const set={...input,id:Date.now(),setNumber:exercise.sets.length+1,recordedAt:new Date().toISOString()}; exercise.sets.push(set); return set }
service.updateSet = async (id,input) => {const set=session.exercises.flatMap(item=>item.sets).find(item=>item.id===id)!;Object.assign(set,input);return set}
service.deleteSet = async id => {for(const exercise of session.exercises) exercise.sets=exercise.sets.filter(set=>set.id!==id)}
service.finishExercise = async id => {const exercise=session.exercises.find(item=>item.id===id)!;exercise.isCompleted=true;exercise.completedAt=new Date().toISOString()}
service.finish = async () => {session.finishedAt=new Date().toISOString();session.status=session.exercises.every(item=>item.isCompleted)?1:2;session.isCompleted=session.status===1}
export function Preview() {return <DashboardShell title="Sua sessão" subtitle="Uma série de cada vez." current="strength" loading={false} refresh={()=>{}} className="training-page session-page"><SessionView id={999} onChanged={()=>{}} /></DashboardShell>}
createRoot(document.getElementById('root')!).render(<Preview />)
