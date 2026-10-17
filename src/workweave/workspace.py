"""Server-owned product settings and synthetic demonstration workflow."""

APP_NAME = "Workweave"
DEMO_ASSIGNMENT = "checkout"
DEMO_STEPS = [
    {"label": "Read your assignment and connected evidence", "path": "/api/context", "body": {}},
    {
        "label": "Save a plan based on the current decision",
        "path": "/api/action",
        "body": {
            "name": "accept",
            "note": "Check pending and failed status states with the approved provider.",
        },
    },
    {
        "label": "Replace the decision: the saved plan now needs review",
        "path": "/api/action",
        "body": {"name": "replace"},
    },
    {
        "label": "Add a newer proposal without changing approved guidance",
        "path": "/api/action",
        "body": {"name": "propose"},
    },
    {
        "label": "Record acknowledgement of the approved replacement",
        "path": "/api/action",
        "body": {"name": "acknowledge-change"},
    },
    {
        "label": "Acknowledge the new approved guidance",
        "path": "/api/action",
        "body": {"name": "review"},
    },
    {
        "label": "Accept and save the updated plan",
        "path": "/api/action",
        "body": {"name": "accept", "note": "Read the approved provider decision before starting."},
    },
    {
        "label": "Complete the required training",
        "path": "/api/action",
        "body": {"name": "complete"},
    },
    {
        "label": "Create a review request with current evidence",
        "path": "/api/action",
        "body": {"name": "request-review"},
    },
    {"label": "Start a new session and retrieve progress", "path": "/api/context", "body": {}},
    {
        "label": "Remove the owner and inspect the missing evidence",
        "path": "/api/action",
        "body": {"name": "remove-owner"},
    },
]
