from pathlib import Path
import pydicom

ROOT = Path(__file__).resolve().parents[1]
DICOM_ROOT = ROOT / 'public' / 'dicom'

# Tags to clear or overwrite
CLEAR_TAGS = [
    'PatientName',
    'PatientID',
    'PatientBirthDate',
    'PatientSex',
    'PatientAge',
    'PatientAddress',
    'PatientTelephoneNumbers',
    'OtherPatientIDs',
    'OtherPatientNames',
    'PatientWeight',
    'PatientSize',
    'StudyID',
    'AccessionNumber',
    'InstitutionName',
    'ReferringPhysicianName',
    'PerformingPhysicianName',
    'OperatorsName',
]

DATE_TAGS = [
    'StudyDate',
    'SeriesDate',
    'AcquisitionDate',
    'ContentDate',
]

TIME_TAGS = [
    'StudyTime',
    'SeriesTime',
    'AcquisitionTime',
    'ContentTime',
]

GENERIC_DATE = '20000101'
GENERIC_TIME = '000000'


def scrub_file(path: Path) -> None:
    ds = pydicom.dcmread(path)
    ds.remove_private_tags()

    for tag in CLEAR_TAGS:
        if tag in ds:
            ds[tag].value = ''

    for tag in DATE_TAGS:
        if tag in ds:
            ds[tag].value = GENERIC_DATE

    for tag in TIME_TAGS:
        if tag in ds:
            ds[tag].value = GENERIC_TIME

    # Optional de-identification flags
    if 'PatientIdentityRemoved' in ds:
        ds.PatientIdentityRemoved = 'YES'
    else:
        ds.add_new((0x0012, 0x0062), 'CS', 'YES')

    if 'DeidentificationMethod' in ds:
        ds.DeidentificationMethod = 'Basic profile'
    else:
        ds.add_new((0x0012, 0x0063), 'LO', 'Basic profile')

    ds.save_as(path)


def main() -> None:
    files = list(DICOM_ROOT.rglob('*.dcm'))
    if not files:
        print('No DICOM files found.')
        return

    for path in files:
        scrub_file(path)

    print(f'Anonymized {len(files)} DICOM files under {DICOM_ROOT}')


if __name__ == '__main__':
    main()
