// CnD Graph Renderer for Magic Racket Webview
// This function is called from the webview HTML and receives the graph data
window.renderCnDGraph = async function(graph) {
  const root = document.getElementById('cnd-root');
  if (!root) return;
  
  const statusElement = document.getElementById('status');
  const graphContainer = document.getElementById('graph-container');
  
  function updateStatus(message, type = 'info') {
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `status ${type}`;
    }
  }

  if (!graph || !graph.atoms || !graph.relations) {
    updateStatus('No graph data provided', 'error');
    return;
  }

  if (typeof CndCore === 'undefined') {
    updateStatus('CnDCore is not loaded', 'error');
    return;
  }

  try {
    updateStatus('Processing Racket data with CnD pipeline...', 'info');
    console.log('🔍 DEBUG: Starting CnD pipeline with graph:', graph);
    
    // Step 1: Create RacketGDataInstance
    console.log('🔍 DEBUG: Creating RacketGDataInstance...');
    const dataInstance = new CndCore.RacketGDataInstance(graph);
    console.log('🔍 DEBUG: Created RacketGDataInstance:', dataInstance);

    // Step 2: Create processed data for evaluator
    let processedData = {
      nodes: graph.atoms.map(atom => ({
        id: atom.id,
        type: atom.type,
        label: atom.label
      })),
      edges: graph.relations.map(relation => ({
        from: relation.src,
        to: relation.dst,
        label: relation.label || '?'
      }))
    };

    // Step 3: Create evaluation context
    const evaluationContext = {
      sourceData: dataInstance,
      processedData: processedData
    };

    // Step 4: Create and initialize SimpleGraphQueryEvaluator
    const evaluator = new CndCore.Evaluators.SGraphQueryEvaluator();
    evaluator.initialize(evaluationContext);

    // Step 5: Parse layout specification (empty = default)
    const layoutSpec = CndCore.parseLayoutSpec('');

    // Step 6: Create LayoutInstance
    const ENABLE_ALIGNMENT_EDGES = true;
    const instanceNumber = 0;
    const layoutInstance = new CndCore.LayoutInstance(
      layoutSpec,
      evaluator,
      instanceNumber,
      ENABLE_ALIGNMENT_EDGES
    );

    // Step 7: Generate layout
    updateStatus('Generating layout...', 'info');
    const projections = {};
    const layoutResult = layoutInstance.generateLayout(dataInstance, projections);
    const instanceLayout = layoutResult.layout;
    
    console.log('Generated Instance Layout:', instanceLayout);

    // Step 8: Render with WebCola
    if (graphContainer && graphContainer.renderLayout) {
      updateStatus('Rendering graph with WebCola...', 'info');
      await graphContainer.renderLayout(instanceLayout);
      updateStatus('Graph rendered successfully!', 'success');
    } else {
      updateStatus('WebCola graph container not available', 'error');
    }

  } catch (error) {
    console.error('CnD pipeline error:', error);
    updateStatus(`Error: ${error.message}`, 'error');
  }
};

// Test function for debugging
window.testCnDPipeline = function() {
  console.log('🧪 Testing CnD pipeline...');
  
  const testGraph = {
    atoms: [
      { id: "A", label: "Node A", type: "Entity" },
      { id: "B", label: "Node B", type: "Entity" }
    ],
    relations: [
      { src: "A", dst: "B", label: "connects" }
    ]
  };
  
  console.log('🧪 Test graph:', testGraph);
  console.log('🧪 CndCore available:', typeof CndCore !== 'undefined');
  
  if (typeof CndCore !== 'undefined') {
    console.log('🧪 CndCore keys:', Object.keys(CndCore));
  }
  
  renderCnDGraph(testGraph);
};
