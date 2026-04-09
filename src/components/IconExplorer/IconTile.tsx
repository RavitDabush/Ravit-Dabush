import { IconProps } from '@phosphor-icons/react';

type Props = {
	name: string;
	Icon: React.FC<IconProps>;
	color: string;
	weight: IconProps['weight'];
};

export default function IconTile({ name, Icon, color, weight }: Props) {
	return (
		<div
			key={`${name}-${weight}`}
			className="icon-item"
			title={`Click to copy "${name}"`}
			onClick={() => navigator.clipboard.writeText(name)}
		>
			<Icon size={32} weight={weight} color={color} />
			<span className="small-text">
				{name} ({weight})
			</span>
		</div>
	);
}
