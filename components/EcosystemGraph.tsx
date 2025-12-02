import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphLink, NodeType, NodeStatus } from '../types';
import { CheckCircle2, CircleDashed, Clock } from 'lucide-react';

interface EcosystemGraphProps {
  width?: number;
  height?: number;
}

const EcosystemGraph: React.FC<EcosystemGraphProps> = ({ width = 800, height = 600 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Data derived from the meeting content with STATUS
  const nodes: GraphNode[] = [
    // Center - The Platform
    { id: 'beidou', label: '北斗智影 (平台)', type: NodeType.CORE, status: NodeStatus.COMPLETED, description: '生态分发核心 / 流量分发逻辑 / 算法理解', fx: width / 2, fy: height / 2, val: 45 },

    // Capabilities (Inputs)
    { id: 'ai_creation', label: 'AI 内容创作', type: NodeType.CAPABILITY, status: NodeStatus.IN_PROGRESS, description: '原创与二创能力，AI动态漫制作', val: 25 },
    { id: 'virtual_human', label: '虚拟人技术', type: NodeType.CAPABILITY, status: NodeStatus.IN_PROGRESS, description: 'OPG版权核心，依托版权进行规模化二创', val: 22 },
    { id: 'kol_integration', label: '达人整合(MCN)', type: NodeType.CAPABILITY, status: NodeStatus.COMPLETED, description: '类比“三只羊”模式，已整合大量头部资源', val: 28 },

    // Joint Ventures (Production - The "Holding" Strategy)
    { id: 'jv_xiaowu', label: '小五兄弟 (JV)', type: NodeType.JV, status: NodeStatus.COMPLETED, description: '首个落地案例，整合头部大V，已实现变现', val: 24 },
    { id: 'jv_anime', label: 'AI 动态漫公司', type: NodeType.JV, status: NodeStatus.PLANNING, description: '拟整合制作链标的，锁定产能', val: 20 },
    { id: 'jv_youtuber', label: '优选 Youtuber', type: NodeType.JV, status: NodeStatus.IN_PROGRESS, description: '持续孵化与资源注入', val: 20 },

    // Outputs/Strategy
    { id: 'global_dist', label: '全球分发 (出海)', type: NodeType.OUTPUT, status: NodeStatus.COMPLETED, description: 'CPS第一，南京乃至全国第一出海分发平台', val: 32 },
    { id: 'monetization', label: '商业变现', type: NodeType.OUTPUT, status: NodeStatus.COMPLETED, description: '帮助版权方变现，正向毛利', val: 28 },
    { id: 'super_individual', label: '超级个体', type: NodeType.STRATEGY, status: NodeStatus.PLANNING, description: '战略愿景：人人都是创作者 -> 超级个体', val: 26 },
  ];

  const links: GraphLink[] = [
    { source: 'ai_creation', target: 'beidou', label: '赋能' },
    { source: 'virtual_human', target: 'beidou', label: '版权注入' },
    { source: 'kol_integration', target: 'beidou', label: '资源整合' },
    
    { source: 'beidou', target: 'jv_xiaowu', label: '控股/合资 (已完成)' },
    { source: 'beidou', target: 'jv_anime', label: '整合 (规划中)' },
    { source: 'beidou', target: 'jv_youtuber', label: '孵化 (进行中)' },
    
    { source: 'beidou', target: 'global_dist', label: '分发' },
    { source: 'global_dist', target: 'monetization', label: '变现' },
    { source: 'jv_xiaowu', target: 'monetization', label: '贡献利润' },
    
    { source: 'ai_creation', target: 'super_individual', label: '演化' },
  ];

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Definitions for markers and patterns
    const defs = svg.append("defs");
    defs.selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#94a3b8");

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(140))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.val + 25));

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d: any) => {
         // Dashed line if target is planning
         const targetNode = nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
         return targetNode?.status === NodeStatus.PLANNING ? "5,5" : "none";
      })
      .attr("marker-end", "url(#arrow)");

    const linkText = svg.append("g")
      .selectAll("text")
      .data(links)
      .enter().append("text")
      .text((d) => d.label || "")
      .attr("font-size", "10px")
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .attr("class", "bg-white"); // Simple background hack via css shadow usually better but text element

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .attr("cursor", "pointer")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node Circles
    node.append("circle")
      .attr("r", (d: any) => d.val)
      .attr("fill", (d: any) => getNodeColor(d.type))
      .attr("stroke", (d: any) => getStatusColor(d.status))
      .attr("stroke-width", (d: any) => d.status === NodeStatus.PLANNING ? 2 : 3)
      .attr("stroke-dasharray", (d: any) => d.status === NodeStatus.PLANNING ? "4,2" : "none")
      .attr("filter", "drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.1))");

    // Status Indicator Dot
    node.append("circle")
      .attr("r", 4)
      .attr("cx", (d: any) => d.val * 0.707) // 45 degrees
      .attr("cy", (d: any) => -d.val * 0.707)
      .attr("fill", (d: any) => getStatusColor(d.status))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    // Node Labels
    node.append("text")
      .text((d: any) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", (d: any) => d.val + 18)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#334155");
      
    // Node Status Text (Small)
    node.append("text")
      .text((d: any) => getStatusText(d.status))
      .attr("text-anchor", "middle")
      .attr("dy", (d: any) => d.val + 32)
      .attr("font-size", "9px")
      .attr("fill", (d: any) => getStatusColor(d.status));

    node.on("click", (event, d) => {
        setSelectedNode(d as GraphNode);
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkText
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      if (d.id !== 'beidou') { 
          d.fx = null;
          d.fy = null;
      }
    }

  }, [width, height]);

  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case NodeType.CORE: return '#3b82f6'; // Blue
      case NodeType.CAPABILITY: return '#8b5cf6'; // Violet
      case NodeType.JV: return '#10b981'; // Emerald
      case NodeType.OUTPUT: return '#f59e0b'; // Amber
      case NodeType.STRATEGY: return '#ef4444'; // Red
      default: return '#94a3b8';
    }
  };

  const getStatusColor = (status: NodeStatus) => {
      switch (status) {
          case NodeStatus.COMPLETED: return '#16a34a'; // Green-600
          case NodeStatus.IN_PROGRESS: return '#3b82f6'; // Blue-500
          case NodeStatus.PLANNING: return '#94a3b8'; // Slate-400
      }
  };

  const getStatusText = (status: NodeStatus) => {
    switch (status) {
        case NodeStatus.COMPLETED: return '已落地'; 
        case NodeStatus.IN_PROGRESS: return '推进中'; 
        case NodeStatus.PLANNING: return '规划中'; 
    }
};

  return (
    <div className="relative bg-slate-50 rounded-xl shadow-inner border border-slate-200 overflow-hidden h-full">
      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-3 rounded-lg border border-slate-200 text-xs shadow-sm">
        <p className="font-bold mb-2 text-slate-700">业务状态图例:</p>
        <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={12} className="text-green-600" /> 
            <span className="text-slate-600">已落地/已验证 (实线)</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
            <CircleDashed size={12} className="text-blue-500" />
            <span className="text-slate-600">正在做/推进中 (实线)</span>
        </div>
        <div className="flex items-center gap-2">
            <Clock size={12} className="text-slate-400" />
            <span className="text-slate-600">未来规划 (虚线)</span>
        </div>
      </div>
      
      <svg ref={svgRef} width={width} height={height} className="w-full h-full"></svg>
      
      {selectedNode && (
        <div className="absolute bottom-4 right-4 z-10 w-72 bg-white/95 backdrop-blur shadow-2xl rounded-xl p-5 border border-slate-100 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-start mb-2">
             <h3 className="font-bold text-slate-800 text-lg">{selectedNode.label}</h3>
             <span className={`px-2 py-0.5 rounded-full text-[10px] text-white font-medium`} style={{backgroundColor: getStatusColor(selectedNode.status)}}>
                {getStatusText(selectedNode.status)}
             </span>
          </div>
          <span className={`inline-block px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500 mb-3`}>
             {selectedNode.type}
          </span>
          <p className="text-sm text-slate-600 leading-relaxed">{selectedNode.description}</p>
        </div>
      )}
    </div>
  );
};

export default EcosystemGraph;