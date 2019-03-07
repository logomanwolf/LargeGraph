import hashlib
import logging
import json
import glob
import pandas as pd
import networkx as nx
from tqdm import tqdm
from joblib import Parallel, delayed
from parsor import parameter_parser
from gensim.models.doc2vec import Doc2Vec, TaggedDocument
import numpy as np

logging.basicConfig(format="%(asctime)s : %(levelname)s : %(message)s", level=logging.INFO)
HashDictionary={}
feees=[]
class WeisfeilerLehmanMachine:
    """
    Weisfeiler Lehman feature extractor class.
    """
    def __init__(self, graph, features, iterations):
        """
        Initialization method which executes feature extraction.
        :param graph: The Nx graph object.
        :param features: Feature hash table.
        :param iterations: Number of WL iterations.
        """
        self.iterations = iterations
        self.graph = graph
        self.features = features
        self.nodes = self.graph.nodes()
        self.extracted_features = [str(v) for k,v in features.items()]
        self.do_recursions()

    def do_a_recursion(self):
        #global hashdictionary
        """
        The method does a single WL recursion.
        :return new_features: The hash table with extracted WL features.
        """
        global HashDictionary
        global feees
        new_features = {}
        for node in self.nodes:
            nebs = self.graph.neighbors(node)
            degs = [self.features[neb] for neb in nebs]
            features = "_".join([str(self.features[node])]+list(set(sorted([str(deg) for deg in degs]))))
            hash_object = hashlib.md5(features.encode())
            hashing = hash_object.hexdigest()
            new_features[node] = hashing
            HashDictionary[hashing]=features
            feees.append(features)
        self.extracted_features = self.extracted_features + list(new_features.values())
        return new_features

    def do_recursions(self):
        """
        The method does a series of WL recursions.
        """
        for iteration in range(self.iterations):
            self.features = self.do_a_recursion()
        
 
def dataset_reader(path):
    """
    Function to read the graph and features from a json file.
    :param path: The path to the graph json.
    :return graph: The graph object.
    :return features: Features hash table.
    :return name: Name of the graph.
    """
    name = path.strip(".json").split("/")[-1]
    data = json.load(open(path))
    graph = nx.from_edgelist(data["edges"])

    if "features" in data.keys():
        features = data["features"]
    else:
        features = nx.degree(graph)

    features = {int(k):v for k,v, in features.items()}
    return graph, features, name

def feature_extractor(path, rounds):
    """
    Function to extract WL features from a graph.
    :param path: The path to the graph json.
    :param rounds: Number of WL iterations.
    :return doc: Document collection object.
    """
    global f
    graph, features, name = dataset_reader(path)
    machine = WeisfeilerLehmanMachine(graph,features,rounds)
    doc = TaggedDocument(words = machine.extracted_features , tags = ["g_" + name])
    return doc
        

def save_embedding(output_path, model, files, dimensions):
    """
    Function to save the embedding.
    :param output_path: Path to the embedding csv.
    :param model: The embedding model object.
    :param files: The list of files.
    :param dimensions: The embedding dimension parameter.
    """
    out = []
    for f in files:
        identifier = f.split("/")[-1].strip(".json")
        out.append([int(identifier)] + list(model.docvecs["g_"+identifier]))

    out = pd.DataFrame(out,columns = ["type"] +["x_" +str(dimension) for dimension in range(dimensions)])
    out = out.sort_values(["type"])
    out.to_csv(output_path, index = None)


# def main(args):
def subgraph(args):

    """
    Main function to read the graph list, extract features, learn the embedding and save it.
    :param args: Object with the arguments.
    """
    graphs = glob.glob(args.input_path + "*.json")
    print("\nFeature extraction started.\n")
    document_collections = Parallel(n_jobs = args.workers)(delayed(feature_extractor)(g, args.wl_iterations) for g in tqdm(graphs))
    print("\nOptimization started.\n")
    model = Doc2Vec(document_collections,
                    size = args.dimensions,
                    window = 0,
                    min_count = args.min_count,
                    dm = 0,
                    sample = args.down_sampling,
                    workers = args.workers,
                    iter = args.epochs,
                    alpha = args.learning_rate)

    save_embedding(args.output_path, model, graphs, args.dimensions)
    filename = args.output_path
    data = np.loadtxt(filename, delimiter=',', skiprows=1)
    data = np.delete(data, 0, axis=1)
    print(data.shape)
    np.savetxt(filename, data, fmt='%.17f', delimiter=',')

if __name__ == "__main__":
    args = parameter_parser()
    subgraph(args)
    print(feees)

