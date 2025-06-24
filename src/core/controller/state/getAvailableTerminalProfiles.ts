// CARET MODIFICATION: Changed proto.cline to proto.caret to align with the new protobuf namespace.
import { Controller } from "../index"
import * as proto from "@/shared/proto"
import { getAvailableTerminalProfiles as getTerminalProfilesFromShell } from "../../../utils/shell"

export async function getAvailableTerminalProfiles(
	controller: Controller,
	request: proto.caret.EmptyRequest,
): Promise<proto.caret.TerminalProfiles> {
	const profiles = getTerminalProfilesFromShell()

	return proto.caret.TerminalProfiles.create({
		profiles: profiles.map((profile) => ({
			id: profile.id,
			name: profile.name,
			path: profile.path || "",
			description: profile.description || "",
		})),
	})
}
