import numpy as np
import networkx as nx
from networkx.readwrite import json_graph
import json
import os

def dealdata4(filename):
    with open(filename) as load_f:
        graphs=json.load(load_f)
        i=0
        for graph in graphs:
            realgraph=json_graph.node_link_graph(graph)
            features=dict()
            nodes=nx.nodes(realgraph)
            for node in nodes:
                degree=nx.degree(realgraph,node)
                # features[str(node)]=degree
            newgraphdata=dict()
            links=graph['links']
            linkdata=[]
            for link in links:
                linkdata.append([link['source'],link['target']])
            newgraphdata['edges']=linkdata
            newgraphdata['features']=features
            writefilename="dataset/"+filename+'/'+str(i).replace(',','')+".json"
            if os.path.exists("dataset/"+filename)==False:
                os.mkdir("dataset/"+filename)
            with open(writefilename, 'w') as file_object:
                json.dump(newgraphdata, file_object)
            print(i)
            i=i+1
    print(filename+'has been seperated into single input file!')
if __name__ == '__main__':
    dealdata4()