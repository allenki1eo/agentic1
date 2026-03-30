"use client";

interface AgentProgressProps {
  tasks: Array<{
    agent_name: string;
    status: string;
    progress_percent: number;
  }>;
}

export default function AgentProgress({ tasks }: AgentProgressProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Done";
      case "in_progress":
        return "Working...";
      case "failed":
        return "Failed";
      case "pending":
        return "Waiting";
      default:
        return status;
    }
  };

  if (tasks.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Agent Progress
      </h3>
      <div className="space-y-3">
        {tasks.map((task, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(task.status)} ${
                task.status === "in_progress" ? "animate-pulse" : ""
              }`}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {task.agent_name}
                </span>
                <span className="text-xs text-gray-500">
                  {getStatusText(task.status)}
                </span>
              </div>
              {task.status === "in_progress" && (
                <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress_percent}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
