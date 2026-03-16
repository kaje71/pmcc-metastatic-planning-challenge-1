import { PaperViewer } from './PaperViewer';
import { NavigateButton } from '../ui/NavigateButton';

export function Supplementary() {
    return (
        <div className="flex flex-col space-y-12 pb-12">
            <PaperViewer />
            <div className="flex justify-start pt-4">
                <NavigateButton
                    label="Back: Calculator"
                    targetTab="calculator"
                    direction="prev"
                />
            </div>
        </div>
    );
}
