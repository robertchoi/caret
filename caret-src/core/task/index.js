"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.cwd = exports.USE_EXPERIMENTAL_CLAUDE4_FEATURES = exports.Task = void 0
// Cline의 Task 클래스 및 필요한 타입들을 가져옵니다.
// 경로는 caret-src/core/task/index.ts 에서 세 단계 위로 올라가 루트, 그 다음 cline/src/core/task 로 이동합니다.
const task_1 = require("../../../src/core/task")
/**
 * Caret의 Task 클래스입니다.
 * Cline의 Task 기능을 상속받아 필요한 부분을 오버라이드하거나 확장합니다.
 * 현재는 최소한의 오버레이 구조만 정의하며, 대부분의 기능은 ClineTask를 따릅니다.
 */
class Task extends task_1.Task {
	// Caret에 특화된 Task 로직이 필요하다면 이곳에 추가합니다.
	// 예를 들어, 생성자를 오버라이드하여 Caret만의 초기화 과정을 추가하거나,
	// 특정 메서드의 동작을 Caret의 요구사항에 맞게 변경할 수 있습니다.
	constructor(
		context,
		mcpHub,
		workspaceTracker,
		updateTaskHistory,
		postStateToWebview,
		postMessageToWebview,
		reinitExistingTaskFromId,
		cancelTask,
		apiConfiguration,
		autoApprovalSettings,
		browserSettings,
		chatSettings,
		shellIntegrationTimeout,
		terminalReuseEnabled,
		terminalOutputLineLimit,
		defaultTerminalProfile,
		enableCheckpointsSetting,
		task,
		images,
		files,
		historyItem,
	) {
		// CARET MODIFICATION: API 설정 완료 후 새 태스크 시작 시 기본 태스크 메시지 제공
		// Cline 원본에서는 historyItem 또는 task/images가 반드시 필요하지만,
		// Caret에서는 API 설정 완료 후 빈 태스크로 시작할 수 있도록 개선
		let effectiveTask = task
		let effectiveImages = images
		let effectiveFiles = files
		// historyItem이 없고 task/images/files도 모두 비어있는 경우 기본 태스크 제공
		if (!historyItem && !task && (!images || images.length === 0) && (!files || files.length === 0)) {
			effectiveTask = "안녕하세요! Caret과 함께 개발을 시작해보세요. 무엇을 도와드릴까요?"
			console.log("[CaretTask] Providing default task message for API setup completion")
		}
		super(
			context,
			mcpHub,
			workspaceTracker,
			updateTaskHistory,
			postStateToWebview,
			postMessageToWebview,
			reinitExistingTaskFromId,
			cancelTask,
			apiConfiguration,
			autoApprovalSettings,
			browserSettings,
			chatSettings,
			shellIntegrationTimeout,
			terminalReuseEnabled,
			terminalOutputLineLimit,
			defaultTerminalProfile,
			enableCheckpointsSetting,
			effectiveTask,
			effectiveImages,
			effectiveFiles,
			historyItem,
		)
		// Caret Task 초기화 완료 로깅
		console.log("[CaretTask] Initialized successfully with enhanced parameter validation")
	}
}
exports.Task = Task
// 이 파일에 Task 클래스 외에 다른 export (상수, 타입, 함수 등)가 있었다면,
// 해당 기능들도 Cline의 것을 가져오거나 (필요 시 경로 수정),
// Caret에서 더 이상 사용하지 않는다면 삭제되었습니다.
// "최소한의 오버레이" 원칙에 따라 이 파일은 가볍게 유지합니다.
// Cline의 task/index.ts 에서 필요한 다른 멤버들을 다시 export 합니다.
// 이렇게 하면 @core/task 경로 별칭을 통해 이 멤버들을 사용할 수 있습니다.
var task_2 = require("../../../src/core/task")
// USE_EXPERIMENTAL_CLAUDE4_FEATURES 와 cwd 를 cline 에서 가져와서 export
Object.defineProperty(exports, "USE_EXPERIMENTAL_CLAUDE4_FEATURES", {
	enumerable: true,
	get: function () {
		return task_2.USE_EXPERIMENTAL_CLAUDE4_FEATURES
	},
})
Object.defineProperty(exports, "cwd", {
	enumerable: true,
	get: function () {
		return task_2.cwd
	},
})
//# sourceMappingURL=index.js.map
