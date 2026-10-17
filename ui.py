"""A small custom A2UI v0.9 catalog and a restricted message producer."""
CATALOG='urn:workweave:catalog:v1'
KINDS={'SummaryCard','EvidenceComparison','PersonCard','Checklist','ProgressCard','QuestionForm'}

def compose(context, selection=None):
 required=['SummaryCard','EvidenceComparison','PersonCard','Checklist','ProgressCard']
 if not context['people'] or context['ambiguous']:required.append('QuestionForm')
 order=selection or required
 if not isinstance(order,list) or len(order)>6 or len(set(order))!=len(order) or set(order)!=set(required):raise ValueError('Invalid component selection')
 components=[{'id':'root','component':'Column','children':[k for k in order]}]
 for kind in order:components.append({'id':kind,'component':kind,'data':{'path':'/context'}})
 return [{'version':'v0.9','createSurface':{'surfaceId':'workspace','catalogId':CATALOG}}, {'version':'v0.9','updateComponents':{'surfaceId':'workspace','components':components}}, {'version':'v0.9','updateDataModel':{'surfaceId':'workspace','path':'/','value':{'context':context}}}]
