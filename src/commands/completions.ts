import type { Command } from "commander";

const SUPPORTED_SHELLS = ["bash", "zsh", "fish"] as const;
type Shell = (typeof SUPPORTED_SHELLS)[number];

interface CmdInfo {
	name: string;
	description: string;
	options: { flags: string; description: string }[];
	subcommands: { name: string; description: string }[];
}

function collectCommands(program: Command): CmdInfo[] {
	const result: CmdInfo[] = [];
	for (const cmd of program.commands) {
		const info: CmdInfo = {
			name: cmd.name(),
			description: cmd.description(),
			options: cmd.options.map((o) => ({
				flags: o.long ?? o.short ?? o.flags,
				description: o.description,
			})),
			subcommands: [],
		};
		for (const sub of cmd.commands) {
			info.subcommands.push({
				name: sub.name(),
				description: sub.description(),
			});
		}
		result.push(info);
	}
	return result;
}

function generateBash(program: Command): string {
	const cmds = collectCommands(program);
	const cmdNames = cmds.map((c) => c.name).join(" ");

	const subcaseBranches: string[] = [];
	for (const cmd of cmds) {
		if (cmd.subcommands.length > 0) {
			const subNames = cmd.subcommands.map((s) => s.name).join(" ");
			subcaseBranches.push(
				`        ${cmd.name})\n            COMPREPLY=( $(compgen -W "${subNames}" -- "$cur") )\n            return 0\n            ;;`,
			);
		}
		if (cmd.options.length > 0) {
			const optFlags = cmd.options.map((o) => o.flags).join(" ");
			subcaseBranches.push(
				`        ${cmd.name})\n            COMPREPLY=( $(compgen -W "${optFlags}" -- "$cur") )\n            return 0\n            ;;`,
			);
		}
	}

	const caseBlock =
		subcaseBranches.length > 0
			? `    case "\${COMP_WORDS[1]}" in\n${subcaseBranches.join("\n")}\n    esac`
			: "";

	return `# bash completion for sd
_sd_completions() {
    local cur prev
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    if [[ \${COMP_CWORD} -eq 1 ]]; then
        COMPREPLY=( $(compgen -W "${cmdNames}" -- "$cur") )
        return 0
    fi

${caseBlock}
}

complete -F _sd_completions sd
`;
}

function generateZsh(program: Command): string {
	const cmds = collectCommands(program);

	const cmdDescLines = cmds.map(
		(c) => `        '${c.name}:${c.description.replace(/'/g, "'\\''")}'`,
	);

	const subcmdFunctions: string[] = [];
	for (const cmd of cmds) {
		const parts: string[] = [];
		for (const o of cmd.options) {
			parts.push(
				`        '${o.flags}[${o.description.replace(/'/g, "'\\''").replace(/\[/g, "\\[").replace(/\]/g, "\\]")}]'`,
			);
		}
		if (cmd.subcommands.length > 0) {
			const subDescs = cmd.subcommands.map(
				(s) => `            '${s.name}:${s.description.replace(/'/g, "'\\''")}'`,
			);
			parts.push(`        '1:subcommand:(('\n${subDescs.join("\n")}\n        ))'`);
		}
		if (parts.length > 0) {
			subcmdFunctions.push(
				`    ${cmd.name})\n        _arguments -s \\\n${parts.join(" \\\n")}\n        ;;`,
			);
		}
	}

	const subcmdCase =
		subcmdFunctions.length > 0
			? `    case "$words[1]" in\n${subcmdFunctions.join("\n")}\n    esac`
			: "";

	return `#compdef sd

_sd() {
    local -a commands
    commands=(
${cmdDescLines.join("\n")}
    )

    _arguments -s \\
        '1:command:_describe "command" commands' \\
        '*::arg:->args'

    case "$state" in
    args)
${subcmdCase}
        ;;
    esac
}

_sd "$@"
`;
}

function generateFish(program: Command): string {
	const cmds = collectCommands(program);
	const lines: string[] = ["# fish completions for sd"];

	// Disable file completions for sd
	lines.push("complete -c sd -f");
	lines.push("");

	// Top-level commands
	const cmdNames = cmds.map((c) => c.name);
	const noSubcmdCond = cmdNames.map((n) => `__fish_seen_subcommand_from ${n}`).join("; or ");

	for (const cmd of cmds) {
		lines.push(
			`complete -c sd -n "not ${noSubcmdCond}" -a ${cmd.name} -d '${cmd.description.replace(/'/g, "\\'")}'`,
		);
	}

	lines.push("");

	// Subcommands and options
	for (const cmd of cmds) {
		for (const sub of cmd.subcommands) {
			lines.push(
				`complete -c sd -n "__fish_seen_subcommand_from ${cmd.name}" -a ${sub.name} -d '${sub.description.replace(/'/g, "\\'")}'`,
			);
		}
		for (const o of cmd.options) {
			const flag = o.flags.replace(/^--?/, "");
			const longFlag = o.flags.startsWith("--") ? `-l ${flag}` : `-s ${flag}`;
			lines.push(
				`complete -c sd -n "__fish_seen_subcommand_from ${cmd.name}" ${longFlag} -d '${o.description.replace(/'/g, "\\'")}'`,
			);
		}
	}

	lines.push("");
	return lines.join("\n");
}

export function register(program: Command): void {
	program
		.command("completions")
		.argument("<shell>", `Shell type (${SUPPORTED_SHELLS.join(", ")})`)
		.description("Output shell completion script")
		.action((shell: string) => {
			if (!SUPPORTED_SHELLS.includes(shell as Shell)) {
				console.error(`Unknown shell: ${shell}. Supported: ${SUPPORTED_SHELLS.join(", ")}`);
				process.exitCode = 1;
				return;
			}
			switch (shell as Shell) {
				case "bash":
					console.log(generateBash(program));
					break;
				case "zsh":
					console.log(generateZsh(program));
					break;
				case "fish":
					console.log(generateFish(program));
					break;
			}
		});
}
