class NotesGraph {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      minNodeSize: 8,
      maxNodeSize: 12,
      activeRadiusFactor: 1.5,
      stroke: 1,
      fontSize: 16,
      ticks: 200,
      fontBaseline: 40,
      maxLabelLength: 50,
      ...options
    };
    
    this.container = document.getElementById(containerId);
    this.zoomLevel = 1;
    this.nodeSize = {};
    
    this.initializeGraph();
  }

  async initializeGraph() {
    try {
      // Load D3.js if not already loaded
      if (typeof d3 === 'undefined') {
        await this.loadD3();
      }
      
      // Load graph data
      const graphData = await this.loadGraphData();
      
      if (!graphData || !graphData.nodes || !graphData.edges) {
        throw new Error('Invalid graph data format');
      }
      
      this.nodesData = graphData.nodes;
      this.linksData = graphData.edges;
      
      this.setupVisualization();
      
    } catch (error) {
      this.handleError(error);
    }
  }

  async loadD3() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/5.16.0/d3.min.js';
      script.crossOrigin = 'anonymous';
      script.integrity = 'sha512-FHsFVKQ/T1KWJDGSbrUhTJyS1ph3eRrxI228ND0EGaEp6v4a/vGwPWd3Dtd/+9cI7ccofZvl/wulICEurHN1pg==';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  async loadGraphData() {
    // Load graph data from the global window object (set by Jekyll)
    if (window.graphData) {
      return window.graphData;
    }
    
    // Fallback: try to fetch from the JSON file
    try {
      const response = await fetch('/assets/notes_graph.json');
      if (!response.ok) {
        throw new Error('Failed to load graph data');
      }
      return await response.json();
    } catch (error) {
      console.warn('Could not load graph data:', error);
      return { nodes: [], edges: [] };
    }
  }

  setupVisualization() {
    this.createSVG();
    this.setupSimulation();
    this.setupZoom();
    this.updateNodeSizes();
    this.restart();
  }

  createSVG() {
    const containerRect = this.container.getBoundingClientRect();
    
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', containerRect.width)
      .attr('height', window.innerHeight * 0.8);
    
    this.width = +this.svg.attr('width');
    this.height = +this.svg.attr('height');
    
    this.g = this.svg.append('g');
    this.link = this.g.append('g').attr('class', 'links').selectAll('.link');
    this.node = this.g.append('g').attr('class', 'nodes').selectAll('.node');
    this.text = this.g.append('g').attr('class', 'text').selectAll('.text');
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.svg.attr('width', window.innerWidth).attr('height', window.innerHeight);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    });
  }

  setupSimulation() {
    this.simulation = d3.forceSimulation(this.nodesData)
      .force('forceX', d3.forceX().x(this.width / 2))
      .force('forceY', d3.forceY().y(this.height / 2))
      .force('charge', d3.forceManyBody())
      .force('link', d3.forceLink(this.linksData).id(d => d.id).distance(70))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(80))
      .stop();
  }

  setupZoom() {
    const zoomHandler = d3.zoom()
      .scaleExtent([0.2, 3])
      .on('zoom', () => this.handleZoom());
    
    this.svg.call(zoomHandler);
  }

  handleZoom() {
    if (d3.event) {
      const scale = d3.event.transform;
      this.zoomLevel = scale.k;
      this.g.attr('transform', scale);
    }
    
    this.updateElementSizes();
  }

  updateElementSizes() {
    const zoomOrKeep = (value) => (this.zoomLevel >= 1 ? value / this.zoomLevel : value);
    const font = Math.max(Math.round(zoomOrKeep(this.options.fontSize)), 1);
    
    this.text.attr('font-size', font)
      .attr('y', d => d.y - zoomOrKeep(this.options.fontBaseline) + 8);
    
    this.link.attr('stroke-width', zoomOrKeep(this.options.stroke));
    
    this.node.attr('r', d => zoomOrKeep(this.nodeSize[d.id]));
    
    this.svg.selectAll('circle')
      .filter((d, i, nodes) => d3.select(nodes[i]).attr('active'))
      .attr('r', d => zoomOrKeep(this.options.activeRadiusFactor * this.nodeSize[d.id]));
  }

  updateNodeSizes() {
    this.nodesData.forEach(node => {
      let weight = 3 * Math.sqrt(
        this.linksData.filter(l => l.source.id === node.id || l.target.id === node.id).length + 1
      );
      
      weight = Math.max(this.options.minNodeSize, Math.min(weight, this.options.maxNodeSize));
      this.nodeSize[node.id] = weight;
    });
  }

  restart() {
    this.updateNodeSizes();
    this.updateNodes();
    this.updateLinks();
    this.updateText();
    this.runSimulation();
  }

  updateNodes() {
    this.node = this.node.data(this.nodesData, d => d.id);
    this.node.exit().remove();
    
    this.node = this.node.enter()
      .append('circle')
      .attr('r', d => this.nodeSize[d.id])
      .on('click', d => this.handleNodeClick(d))
      .on('mouseover', d => this.handleNodeMouseover(d))
      .on('mouseout', d => this.handleNodeMouseout(d))
      .merge(this.node);
  }

  updateLinks() {
    this.link = this.link.data(this.linksData, d => `${d.source.id}-${d.target.id}`);
    this.link.exit().remove();
    
    this.link = this.link.enter()
      .append('line')
      .attr('stroke-width', this.options.stroke)
      .merge(this.link);
  }

  updateText() {
    this.text = this.text.data(this.nodesData, d => d.label);
    this.text.exit().remove();
    
    this.text = this.text.enter()
      .append('text')
      .text(d => this.shortenText(d.label.replace(/_*/g, ''), this.options.maxLabelLength))
      .attr('font-size', `${this.options.fontSize}px`)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .on('click', d => this.handleNodeClick(d))
      .on('mouseover', d => this.handleNodeMouseover(d))
      .on('mouseout', d => this.handleNodeMouseout(d))
      .merge(this.text);
  }

  runSimulation() {
    this.node.attr('active', d => this.isCurrentPath(d.path) ? true : null);
    this.text.attr('active', d => this.isCurrentPath(d.path) ? true : null);
    
    this.simulation.nodes(this.nodesData);
    this.simulation.force('link').links(this.linksData);
    this.simulation.alpha(1).restart();
    this.simulation.stop();
    
    // Run simulation for specified ticks
    for (let i = 0; i < this.options.ticks; i++) {
      this.simulation.tick();
    }
    
    this.updatePositions();
  }

  updatePositions() {
    this.node.attr('cx', d => d.x).attr('cy', d => d.y);
    
    this.text.attr('x', d => d.x)
      .attr('y', d => d.y - (this.options.fontBaseline - this.nodeSize[d.id]) / this.zoomLevel);
    
    this.link.attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
  }

  handleNodeClick(d) {
    if (d.path) {
      window.location = d.path;
    }
  }

  handleNodeMouseover(d) {
    const relatedNodesSet = new Set();
    
    this.linksData
      .filter(n => n.target.id === d.id || n.source.id === d.id)
      .forEach(n => {
        relatedNodesSet.add(n.target.id);
        relatedNodesSet.add(n.source.id);
      });
    
    // Update node styles
    this.node.attr('class', nodeD => {
      return (nodeD.id !== d.id && !relatedNodesSet.has(nodeD.id)) ? 'inactive' : '';
    });
    
    // Update link styles
    this.link.attr('class', linkD => {
      return (linkD.source.id !== d.id && linkD.target.id !== d.id) ? 'inactive' : '';
    }).attr('stroke-width', linkD => {
      return (linkD.source.id === d.id || linkD.target.id === d.id) ? 
        this.options.stroke * 4 : this.options.stroke;
    });
    
    // Update text styles
    this.text.attr('class', textD => {
      return (textD.id !== d.id && !relatedNodesSet.has(textD.id)) ? 'inactive' : '';
    });
  }

  handleNodeMouseout(d) {
    this.node.attr('class', '');
    this.link.attr('class', '').attr('stroke-width', this.options.stroke);
    this.text.attr('class', '');
  }

  isCurrentPath(notePath) {
    return window.location.pathname.includes(notePath);
  }

  shortenText(str, maxLen, separator = ' ') {
    if (str.length <= maxLen) return str;
    return str.substr(0, str.lastIndexOf(separator, maxLen)) + '...';
  }

  handleError(error) {
    console.error('Notes Graph Error:', error);
    
    this.container.innerHTML = `
      <div class="graph-error">
        <p>Unable to load notes graph.</p>
        <p><small>Error: ${error.message}</small></p>
      </div>
    `;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const graphContainer = document.getElementById('graph-wrapper');
  if (graphContainer) {
    new NotesGraph('graph-wrapper');
  }
});