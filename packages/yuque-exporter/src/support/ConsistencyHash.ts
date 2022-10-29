// @ts-ignore
import createRedBlackTree from "functional-red-black-tree";

interface ConsistencyHashNode {
  hash: number;
  virtualNode: string;
  physicalNode: string;
}

export default class ConsistencyHash {

  /**
   * 每个服务器虚拟节点个数
   *
   * @private
   */
  private readonly virtualNodeNum: number;
  private readonly physicalNodes: Set<string>;
  private sortedNodes: ConsistencyHashNode[];
  private physicalNodeHits: Map<string, number>;

  public constructor(virtualNodeNum: number) {
    this.virtualNodeNum = virtualNodeNum;
    this.physicalNodes = new Set<string>();
    this.sortedNodes = [];
    this.physicalNodeHits = new Map<string, number>();
  }


  /**
   * 添加物理结点
   *
   * @param physicalNode 物理结点
   */
  public addPhysicalNode(physicalNode: string): boolean {
    if (this.physicalNodes.has(physicalNode)) {
      return false;
    }
    this.physicalNodes.add(physicalNode);
    const nodes = this.getNodes(physicalNode);
    nodes.forEach(node => this.sortedNodes.push(node));
    this.sortedNodes = ConsistencyHash.sort(this.sortedNodes);
    return true;
  }

  /**
   * 移除物理结点
   *
   * @param physicalNode 物理结点
   */
  public removePhysicalNode(physicalNode: string): boolean {
    if (!this.physicalNodes.has(physicalNode)) {
      return false;
    }
    this.physicalNodes.delete(physicalNode);
    const nodes = this.getNodes(physicalNode);
    const newNodes = this.sortedNodes.filter(item => {
      for (let node of nodes) {
        if (node.hash === item.hash) {
          return false;
        }
      }
      return true;
    });
    this.sortedNodes = ConsistencyHash.sort(newNodes);
    return true;
  }


  /**
   * 获取 key 映射的物理结点
   *
   * @param key
   */
  public getPhysicalNode(key: string): string {
    return this.getConsistencyHashNode(key).physicalNode;
  }

  protected getConsistencyHashNode(key: string) {
    const hashCode = ConsistencyHash.hash(key);
    for (let node of this.sortedNodes) {
      if (node.hash > hashCode) {
        this.hitPhysicalNode(node);
        return node;
      }
    }
    this.hitPhysicalNode(this.sortedNodes[0]);
    return this.sortedNodes[0];
  }

  private hitPhysicalNode(node: ConsistencyHashNode) {
    let physicalNodeHit = this.physicalNodeHits.get(node.physicalNode);
    if (physicalNodeHit === null || physicalNodeHit == undefined) {
      physicalNodeHit = 1;
    } else {
      physicalNodeHit++;
    }
    this.physicalNodeHits.set(node.physicalNode, physicalNodeHit);
  }

  /**
   * 获取 key 映射的虚拟结点
   *
   * @param key
   */
  public getVirtualNode(key: string): string {
    return this.getConsistencyHashNode(key).virtualNode;
  }

  private static sort(nodes: ConsistencyHashNode[]) {
    return nodes.sort((n1, n2) => n1.hash - n2.hash);
  }

  private getNodes(physicalNode: string): ConsistencyHashNode[] {
    const nodes: ConsistencyHashNode[] = [];
    for (let i = 0; i < this.virtualNodeNum; i++) {
      const virtualNode = `${physicalNode}#VN${i}`;
      nodes.push({
        hash: ConsistencyHash.hash(virtualNode),
        virtualNode: virtualNode,
        physicalNode: physicalNode
      });
    }
    return nodes;
  }

  /**
   * 使用FNV1_32_HASH算法计算服务器的Hash值
   */
  private static hash(node: string): number {
    const p: number = 16777619;
    let hash: number = 2166136261;
    for (let i = 0; i < node.length; i++) {
      hash = (hash ^ node.charCodeAt(i)) * p;
    }
    hash += hash << 13;
    hash ^= hash >> 7;
    hash += hash << 3;
    hash ^= hash >> 17;
    hash += hash << 5;

    // 如果算出来的值为负数则取其绝对值
    if (hash < 0)
      hash = Math.abs(hash);
    return hash;
  }

  public getPhysicalNodes() {
    return this.physicalNodes;
  }

  public getConsistencyHashNodes() {
    return this.sortedNodes;
  }

  public getHits() {
    const hits: Map<string, number> = new Map<string, number>();
    this.physicalNodeHits.forEach((v, k) => hits.set(k, v));
    for (let physicalNode of this.physicalNodes) {
      if (!hits.has(physicalNode)) {
        hits.set(physicalNode, 0);
      }
    }
    return hits;
  }
}

