const RULES = {
    BCI: ["brain-computer", "brain computer", "bci", "brain-machine", "neural interface"],
    Implants: ["implant", "electrode", "intracortical", "neurostimulation", "deep brain stimulation"],
    EEG: ["eeg", "electroencephalograph"],
    Wearables: ["wearable", "headset", "headband", "headphone"],
    Medical: ["patient", "clinical", "epilep", "stroke", "paralys", "therapy", "parkinson"],
    Imaging: ["fmri", "fnirs", "neuroimaging", "mri", "optical imaging"],
};

export function getTags(text = "") {
    const lower = text.toLowerCase();
    return Object.keys(RULES).filter((tag) =>
        RULES[tag].some((word) => lower.includes(word))
    );
}
