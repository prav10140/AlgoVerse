import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage';
import TopicsPage from './components/TopicsPage';

// Linked List Components
import LinkedListDashboard from './components/linkedlist/LinkedListDashboard';
import LLBasicOperations from './components/linkedlist/BasicOperations';
import ReverseList from './components/linkedlist/ReverseList';
import DetectCycle from './components/linkedlist/DetectCycle';
import PalindromeList from './components/linkedlist/PalindromeList';
import LLAIBuilder from './components/linkedlist/LLAIBuilder';

// Array Components
import ArrayDashboard from './components/arrays/ArrayDashboard';
import BasicOperations from './components/arrays/BasicOperations';
import TwoSum from './components/arrays/TwoSum';
import ReverseArray from './components/arrays/ReverseArray';
import RotateArray from './components/arrays/RotateArray';
import SortColors from './components/arrays/SortColors';
import FindPeak from './components/arrays/FindPeak';
import MajorityElement from './components/arrays/MajorityElement';
import SetMatrixZeroesViz from './components/arrays/SetMatrixZeroesViz';
import AIAlgoBuilder from './components/arrays/AIAlgoBuilder';

// Stack Components
import StackDashboard from './components/stack/StackDashboard';
import StackBasicOperations from './components/stack/StackBasicOperations';
import ValidParentheses from './components/stack/ValidParentheses';

// Queue Components
import QueueDashboard from './components/queue/QueueDashboard';
import QueueBasicOperations from './components/queue/QueueBasicOperations';

// Tree Components
import TreeDashboard from './components/tree/TreeDashboard';
import TreeBasicOperations from './components/tree/TreeBasicOperations';
import TreeTraversals from './components/tree/TreeTraversals';

// Graph Components
import GraphDashboard from './components/graph/GraphDashboard';
import GraphBasicOperations from './components/graph/GraphBasicOperations';

// Sorting Components
import SortingDashboard from './components/sorting/SortingDashboard';
import SortingVisualizer from './components/sorting/SortingVisualizer';
import MergeSortTree from './components/sorting/MergeSortTree';
import QuickSortTree from './components/sorting/QuickSortTree'; // 1. IMPORT ADDED

function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* 1. LANDING PAGE */}
      <Route path="/" element={<LandingPage onStart={() => navigate('/topics')} />} />
      
      {/* 2. TOPICS PAGE */}
      <Route path="/topics" element={
        <TopicsPage 
          onBack={() => navigate('/')} 
          onSelectTopic={(id) => {
            if (id === 'array') navigate('/array');
            else if (id === 'linkedlist' || id === 'll') navigate('/linkedlist');
            else if (id === 'stack') navigate('/stack');
            else if (id === 'queue') navigate('/queue');
            else if (id === 'tree') navigate('/tree');
            else if (id === 'graph') navigate('/graph');
            else if (id === 'sorting') navigate('/sorting');
            else alert("Coming Soon!");
          }} 
        />
      } />

      {/* ================= ARRAY ROUTES ================= */}
      <Route path="/array" element={
        <ArrayDashboard 
          onBack={() => navigate('/topics')}
          onNavigate={(id) => {
            if (id === 'basic') navigate('/array/basic');
            else if (id === 'twosum') navigate('/array/twosum');
            else if (id === 'reverse') navigate('/array/reverse');
            else if (id === 'rotate') navigate('/array/rotate');
            else if (id === 'sortcolors') navigate('/array/sortcolors');
            else if (id === 'findpeak') navigate('/array/findpeak');
            else if (id === 'majority') navigate('/array/majority');
            else if (id === 'set-zeroes') navigate('/array/set-zeroes');
            else if (id === 'ai-builder') navigate('/ai-builder');
            else alert("Coming Soon!");
          }}
        />
      } />
      <Route path="/array/basic" element={<BasicOperations onBack={() => navigate('/array')} />} />
      <Route path="/array/twosum" element={<TwoSum onBack={() => navigate('/array')} />} />
      <Route path="/array/reverse" element={<ReverseArray onBack={() => navigate('/array')} />} />
      <Route path="/array/rotate" element={<RotateArray onBack={() => navigate('/array')} />} />
      <Route path="/array/sortcolors" element={<SortColors onBack={() => navigate('/array')} />} />
      <Route path="/array/findpeak" element={<FindPeak onBack={() => navigate('/array')} />} />
      <Route path="/array/majority" element={<MajorityElement onBack={() => navigate('/array')} />} />
      <Route path="/array/set-zeroes" element={<SetMatrixZeroesViz onBack={() => navigate('/array')} />} />
        

      {/* ================= LINKED LIST ROUTES ================= */}
      <Route path="/linkedlist" element={
        <LinkedListDashboard 
          onBack={() => navigate('/topics')}
          onNavigate={(id) => {
            if (id === 'basic') navigate('/linkedlist/basic');
            else if (id === 'reverse') navigate('/linkedlist/reverse');
            else if (id === 'cycle') navigate('/linkedlist/cycle');
            else if (id === 'palindrome') navigate('/linkedlist/palindrome');
            else if (id === 'ai-builder') navigate('/ai-builder');
            else alert("Coming Soon!");
          }}
        />
      } />
      <Route path="/linkedlist/basic" element={<LLBasicOperations onBack={() => navigate('/linkedlist')} />} />
      <Route path="/linkedlist/reverse" element={<ReverseList onBack={() => navigate('/linkedlist')} />} />
      <Route path="/linkedlist/cycle" element={<DetectCycle onBack={() => navigate('/linkedlist')} />} />
      <Route path="/linkedlist/palindrome" element={<PalindromeList onBack={() => navigate('/linkedlist')} />} />
      <Route path="/linkedlist/ai-builder" element={<LLAIBuilder onBack={() => navigate('/linkedlist')} />} />

      {/* ================= STACK ROUTES ================= */}
      <Route path="/stack" element={
        <StackDashboard 
          onBack={() => navigate('/topics')}
          onNavigate={(id) => {
            if (id === 'basic') navigate('/stack/basic');
            else if (id === 'valid-parentheses') navigate('/stack/valid');
            else if (id === 'ai-builder') navigate('/ai-builder');
            else alert("Coming Soon!");
          }}
        />
      } />
      <Route path="/stack/basic" element={<StackBasicOperations onBack={() => navigate('/stack')} />} />
      <Route path="/stack/valid" element={<ValidParentheses onBack={() => navigate('/stack')} />} />

      {/* ================= QUEUE ROUTES ================= */}
      <Route path="/queue" element={
        <QueueDashboard 
          onBack={() => navigate('/topics')}
          onNavigate={(id) => {
            if (id === 'basic') navigate('/queue/basic');
            else alert("Coming Soon!");
          }}
        />
      } />
      <Route path="/queue/basic" element={<QueueBasicOperations onBack={() => navigate('/queue')} />} />

      {/* ================= TREE ROUTES ================= */}
      <Route path="/tree" element={
        <TreeDashboard 
          onBack={() => navigate('/topics')}
          onNavigate={(id) => {
            if (id === 'basic') navigate('/tree/basic');
            else if (id === 'traversal') navigate('/tree/traversal');
            else alert("Coming Soon!");
          }}
        />
      } />
      <Route path="/tree/basic" element={<TreeBasicOperations onBack={() => navigate('/tree')} />} />
      <Route path="/tree/traversal" element={<TreeTraversals onBack={() => navigate('/tree')} />} />

      {/* ================= GRAPH ROUTES ================= */}
      <Route path="/graph" element={
        <GraphDashboard 
          onBack={() => navigate('/topics')}
          onNavigate={(id) => {
            if (id === 'basic') navigate('/graph/basic');
            else if (id === 'ai-builder') navigate('/ai-builder');
            else alert("Coming Soon!");
          }}
        />
      } />
      <Route path="/graph/basic" element={<GraphBasicOperations onBack={() => navigate('/graph')} />} />

      {/* ================= SORTING ROUTES ================= */}
      <Route path="/sorting" element={
        <SortingDashboard 
          onBack={() => navigate('/topics')}
          onNavigate={(id) => {
            // 2. UPDATED NAVIGATION LOGIC
            if (id === 'merge') {
               navigate('/sorting/merge-tree');
            } 
            else if (id === 'quick') {
               navigate('/sorting/quick-tree'); // Redirects Quick Sort to Tree view
            }
            else if (['bubble', 'selection', 'insertion'].includes(id)) {
               navigate('/sorting/visualizer');
            } 
            else if (id === 'ai-builder') {
               navigate('/ai-builder');
            } 
            else {
               alert("Coming Soon!");
            }
          }}
        />
      } />
      
      {/* 3. ADDED ROUTES */}
      <Route path="/sorting/visualizer" element={<SortingVisualizer onBack={() => navigate('/sorting')} />} />
      <Route path="/sorting/merge-tree" element={<MergeSortTree onBack={() => navigate('/sorting')} />} />
      <Route path="/sorting/quick-tree" element={<QuickSortTree onBack={() => navigate('/sorting')} />} />

      {/* ================= SHARED ROUTES ================= */}
      <Route path="/ai-builder" element={<AIAlgoBuilder onBack={() => navigate(-1)} />} />

    </Routes>
  );
}

export default App;