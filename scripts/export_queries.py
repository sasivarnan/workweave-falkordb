"""Export checked-in Cypher call sites without executing the application."""
import ast
from pathlib import Path
root=Path(__file__).resolve().parents[1]
tree=ast.parse((root/'graph.py').read_text())
lines=['# Cypher catalogue','','Generated from graph.py by scripts/export_queries.py. Dynamic templates use code-owned labels and relationship types. Parameters are passed separately by the official client.','']
count=0
for node in ast.walk(tree):
 if isinstance(node,ast.Call) and isinstance(node.func,ast.Attribute) and node.func.attr=='q' and len(node.args)>=2:
  name=node.args[0].value if isinstance(node.args[0],ast.Constant) else ast.unparse(node.args[0])
  query=node.args[1].value if isinstance(node.args[1],ast.Constant) else ast.unparse(node.args[1])
  lines.extend([f'## {name}',f'Source: graph.py:{node.lineno}','','```cypher',query,'```','']);count+=1
(root/'docs/CYPHER.md').write_text('\n'.join(lines))
print(f'Exported {count} graph call sites')
