/* eslint-disable perfectionist/sort-objects */
import React, { useEffect, useState } from 'react';

import type { DatasetViewPaginationDto, TabularDataset } from '@databank/types';
import { Button, Card, DropdownMenu } from '@douglasneuroinformatics/libui/components';
import { useDownload, useNotificationsStore } from '@douglasneuroinformatics/libui/hooks';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { type RouteObject, useNavigate, useParams } from 'react-router-dom';

import { LoadingFallback } from '@/components';
import { useAuthStore } from '@/stores/auth-store';

import { DatasetPagination } from '../../dataset/components/DatasetPagination';
import DatasetTable from '../../dataset/components/DatasetTable';

const ViewOneProjectDatasetPage = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const notifications = useNotificationsStore();
  const params = useParams();
  const [dataset, setDataset] = useState<TabularDataset | null>(null);
  const download = useDownload();
  const { currentUser } = useAuthStore();

  const [columnPaginationDto, setColumnPaginationDto] = useState<DatasetViewPaginationDto>({
    currentPage: 1,
    itemsPerPage: 10
  });

  const [rowPaginationDto, setRowPaginationDto] = useState<DatasetViewPaginationDto>({
    currentPage: 1,
    itemsPerPage: 10
  });

  useEffect(() => {
    const fetchDataset = () => {
      axios
        .post<TabularDataset>(`/v1/projects/dataset/${params.projectId}/${params.datasetId}`, {
          columnPaginationDto,
          rowPaginationDto
        })
        .then((response) => {
          setDataset(response.data);
        })
        .catch(console.error);
    };
    void fetchDataset();
  }, [columnPaginationDto, rowPaginationDto]);

  const isManager = Boolean(dataset?.managerIds.includes(currentUser!.id));

  const deleteDataset = (datasetId: string) => {
    axios
      .delete(`/v1/datasets/${datasetId}`)
      .then(() => {
        notifications.addNotification({
          type: 'success',
          message: `Dataset with Id ${datasetId} has been deleted`
        });
        navigate('/portal/datasets');
      })
      .catch(console.error);
  };

  const handleDataDownload = (format: 'CSV' | 'TSV', data: TabularDataset) => {
    const delimiter = format === 'CSV' ? ',' : '\t';
    const filename = data.name + '_' + new Date().toISOString() + '.' + format.toLowerCase();
    let resultString = data.columns.join(delimiter) + '\n';
    for (let row of data.rows) {
      resultString += Object.values(row).join(delimiter) + '\n';
    }

    // axios request to get the data string for the entire dataset
    // once the request is resolved, send it to the download function
    void download(filename, resultString);
  };

  const handleMetaDataDownload = (format: 'CSV' | 'TSV', data: TabularDataset) => {
    const delimiter = format === 'CSV' ? ',' : '\t';
    const filename = 'metadata_' + data.name + '_' + new Date().toISOString() + '.' + format.toLowerCase();

    // axios request to get the meta data string for the entire dataset
    // once the request is resolved, send it to the download function

    const metaDataHeader = [
      'column_name',
      'column_type',
      'nullable',
      'count',
      'nullCount',
      'max',
      'min',
      'mean',
      'median',
      'mode',
      'std',
      'distribution'
    ];

    let metadataRowsString = metaDataHeader.join(delimiter) + '\n';
    for (let columnName of Object.keys(data.metadata)) {
      metadataRowsString +=
        columnName +
        delimiter +
        data.metadata[columnName]?.kind +
        delimiter +
        data.metadata[columnName]?.nullable +
        delimiter +
        data.metadata[columnName]?.count +
        delimiter +
        data.metadata[columnName]?.nullCount +
        delimiter +
        data.metadata[columnName]?.max +
        delimiter +
        data.metadata[columnName]?.min +
        delimiter +
        data.metadata[columnName]?.mean +
        delimiter +
        data.metadata[columnName]?.median +
        delimiter +
        data.metadata[columnName]?.mode +
        delimiter +
        data.metadata[columnName]?.std +
        delimiter +
        JSON.stringify(data.metadata[columnName]?.distribution) +
        delimiter +
        '\n';
    }
    void download(filename, metadataRowsString);
  };

  return dataset ? (
    <>
      <Card>
        <Card.Header>
          <Card.Title>{`${t('datasetName')}: ${dataset.name}`}</Card.Title>
          <Card.Description>{`${t('datasetDescription')}: ${dataset.description}`}</Card.Description>
          {isManager && (
            <div className="flex justify-between">
              <Button className="m-2" variant={'danger'} onClick={() => deleteDataset(dataset.id)}>
                {t('deleteDataset')}
              </Button>
            </div>
          )}
        </Card.Header>
        <Card.Content>
          <ul>
            <li>
              {t('createdAt')}
              {`: ${dataset.createdAt.toString()}`}
            </li>
            <li>
              {t('updatedAt')}
              {`: ${dataset.updatedAt.toString()}`}
            </li>
            <li>{`${t('datasetLicense')}: ${dataset.license}`}</li>
          </ul>

          <DatasetPagination
            currentPage={columnPaginationDto.currentPage}
            itemsPerPage={columnPaginationDto.itemsPerPage}
            kind={'COLUMN'}
            setDatasetPagination={setColumnPaginationDto}
            totalNumberOfItems={dataset.totalNumberOfColumns}
          />

          <DatasetTable
            columnIds={dataset.columnIds}
            columns={dataset.columns}
            createdAt={dataset.createdAt}
            datasetType={dataset.datasetType}
            description={dataset.description}
            id={dataset.id}
            isManager={false}
            isReadyToShare={dataset.isReadyToShare}
            license={dataset.license}
            managerIds={dataset.managerIds}
            metadata={dataset.metadata}
            name={dataset.name}
            permission={'MANAGER'}
            primaryKeys={dataset.primaryKeys}
            rows={dataset.rows}
            totalNumberOfColumns={dataset.columns.length}
            totalNumberOfRows={dataset.totalNumberOfRows}
            updatedAt={dataset.updatedAt}
          />

          <DatasetPagination
            currentPage={rowPaginationDto.currentPage}
            itemsPerPage={rowPaginationDto.itemsPerPage}
            kind={'ROW'}
            setDatasetPagination={setRowPaginationDto}
            totalNumberOfItems={dataset.totalNumberOfRows}
          />
        </Card.Content>
        <Card.Footer>
          <>
            <Button className="m-2" variant={'secondary'}>
              <DropdownMenu>
                <DropdownMenu.Trigger className="flex items-center justify-between gap-3">
                  {t('downloadDataset')}
                  <ChevronDownIcon className="size-[1rem]" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="w-48">
                  <DropdownMenu.Item onClick={() => handleDataDownload('TSV', dataset)}>
                    {t('downloadTsv')}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => handleDataDownload('CSV', dataset)}>
                    {t('downloadCsv')}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            </Button>

            <Button className="m-2" variant={'secondary'}>
              <DropdownMenu>
                <DropdownMenu.Trigger className="flex items-center justify-between gap-3">
                  {t('downloadMetadata')}
                  <ChevronDownIcon className="size-[1rem]" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="w-48">
                  <DropdownMenu.Item onClick={() => handleMetaDataDownload('TSV', dataset)}>
                    {t('downloadTsv')}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => handleMetaDataDownload('CSV', dataset)}>
                    {t('downloadCsv')}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            </Button>
          </>
        </Card.Footer>
      </Card>
    </>
  ) : (
    <LoadingFallback />
  );
};

export const ViewOneProjectDatasetRoute: RouteObject = {
  path: 'project/dataset/:projectId/:datasetId',
  element: <ViewOneProjectDatasetPage />
};
