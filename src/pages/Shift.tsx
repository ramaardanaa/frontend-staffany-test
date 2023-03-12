import React, { FunctionComponent, useEffect, useState } from "react";
import moment from 'moment';
import Grid from "@material-ui/core/Grid";
import { Button } from "@material-ui/core";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import { makeStyles } from "@material-ui/core/styles";
import { getErrorMessage } from "../helper/error/index";
import { deleteShiftById, getShifts, publishShift } from "../helper/api/shift";
import DataTable from "react-data-table-component";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import ArrowBack from "@material-ui/icons/ArrowBackIosOutlined";
import ArrowForward from "@material-ui/icons/ArrowForwardIosOutlined";
import { useHistory } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import Alert from "@material-ui/lab/Alert";
import { Link as RouterLink } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  root: {
    minWidth: 275,
  },
  fab: {
    position: "absolute",
    bottom: 40,
    right: 40,
    backgroundColor: 'white',
    color: theme.color.turquoise
  },
  addButton: {
    color: theme.color.turqouise,
    borderColor: theme.color.turqouise,
    marginRight: 20
  },
  publishButton: {
    backgroundColor: theme.color.turqouise,
    color: 'white'
  },
  arrow: {
    margin: '0px 20px'
  }
}));

interface ActionButtonProps {
  id: string;
  onDelete: () => void;
}
const ActionButton: FunctionComponent<ActionButtonProps> = ({
  id,
  onDelete,
}) => {
  return (
    <div>
      <IconButton
        size="small"
        aria-label="delete"
        component={RouterLink}
        to={`/shift/${id}/edit`}
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="delete" onClick={() => onDelete()}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </div>
  );
};

interface WeeklyShiftButtonProps {
  weekId: Date;
  setWeekId: (weekId: Date) => void;
}

const findWeeklyShift = (date: Date) => {
  const firstDayOfWeek = moment.utc(date).day(1).subtract(1, 'days').toDate()
  const lastDayOfWeek = moment.utc(firstDayOfWeek).add(6, 'days').toDate()

  return [firstDayOfWeek, lastDayOfWeek]
}

const WeeklyShiftButton: FunctionComponent<WeeklyShiftButtonProps> = ({ weekId, setWeekId }) => {
  const classes = useStyles()
  const [firstDayOfWeek, lastDayOfWeek] = findWeeklyShift(weekId)
  const handleArrowBack = () => {
    const newWeek = moment(weekId).subtract(7, 'days').toDate()
    setWeekId(newWeek)
  }
  const handleArrowForward = () => {
    const newWeek = moment(weekId).add(7, 'days').toDate()
    setWeekId(newWeek)
  }

  return (
    <div>
      <IconButton size="small" className={classes.arrow} aria-label="back">
        <ArrowBack onClick={handleArrowBack} fontSize="small" />
      </IconButton>
      <span>{moment(firstDayOfWeek).format("MMM D")} - {moment(lastDayOfWeek).format("MMM D")}</span>
      <IconButton size="small" className={classes.arrow} aria-label="back">
        <ArrowForward onClick={handleArrowForward} fontSize="small" />
      </IconButton>
    </div>
  )
}

interface Shift {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  isPublished: boolean
}

const Shift = () => {
  const classes = useStyles();
  const history = useHistory();

  const [rows, setRows] = useState<Shift[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [weekId, setWeekId] = useState(moment().toDate())
  const [limit, setLimit] = useState(10);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [publishLoading, setPublishLoading] = useState<boolean>(false);

  const onDeleteClick = (id: string) => {
    setSelectedId(id);
    setShowDeleteConfirm(true);
  };

  const onPublishClick = () => {
    setShowPublishConfirm(true);
  };

  const onCloseDeleteDialog = () => {
    setSelectedId(null);
    setShowDeleteConfirm(false);
  };

  const onClosePublishDialog = () => {
    setShowPublishConfirm(false);
  };

  const publishShiftByWeekId = async () => {
    try {
      setPublishLoading(true);
      setErrMsg("");

      await publishShift({ weekId })

    } catch (error) {
      const message = getErrorMessage(error);
      setErrMsg(message);
    } finally {
      const { results: {data, totalCount} } = await getShifts(weekId, 1, limit);
      setRows(data);
      setTotalCount(totalCount)
      setPublishLoading(false);
      onClosePublishDialog();
    }
  }

  const getData = async (page: number) => {
    try {
      setIsLoading(true);
      setErrMsg("");
      const { results: { data, totalCount } } = await getShifts(weekId, page, limit);
      setRows(data);
      setTotalCount(totalCount)
    } catch (error) {
      const message = getErrorMessage(error);
      setErrMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getData(1);
  }, [weekId]);

  const columns = [
    {
      name: "Name",
      selector: "name",
      sortable: true,
    },
    {
      name: "Date",
      selector: "date",
      sortable: true,
    },
    {
      name: "Start Time",
      selector: "startTime",
      sortable: true,
    },
    {
      name: "End Time",
      selector: "endTime",
      sortable: true,
    }
  ];

  const columnsWithActions = [
    ...columns,
    {
      name: "Actions",
      cell: (row: any) => (
        <ActionButton id={row.id} onDelete={() => onDeleteClick(row.id)} />
      ),
    }
  ]

  const isShiftPublished = rows.find(row => row.isPublished === true)

  const deleteDataById = async () => {
    try {
      setDeleteLoading(true);
      setErrMsg("");

      if (selectedId === null) {
        throw new Error("ID is null");
      }

      console.log(deleteDataById);

      await deleteShiftById(selectedId);

      const tempRows = [...rows];
      const idx = tempRows.findIndex((v: any) => v.id === selectedId);
      tempRows.splice(idx, 1);
      setRows(tempRows);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrMsg(message);
    } finally {
      setDeleteLoading(false);
      onCloseDeleteDialog();
    }
  };

  const handlePageChange = (page: number) => {
    getData(page);
  };

  const handlePerRowsChange = async (limit: number, page: number) => {
    try {
      setIsLoading(true);
      setErrMsg("");
      const { results: [data, totalCount] } = await getShifts(weekId, page, limit);
      setRows(data);
      setTotalCount(totalCount)
      setLimit(limit)
    } catch (error) {
      const message = getErrorMessage(error);
      setErrMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card className={classes.root}>
          <CardContent>
            {errMsg.length > 0 ? (
              <Alert severity="error">{errMsg}</Alert>
            ) : (
              <></>
            )}
            <Grid
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <WeeklyShiftButton weekId={weekId} setWeekId={setWeekId} />
              <div>
                <Button
                  variant="outlined"
                  className={classes.addButton}
                  disabled={!!isShiftPublished}
                  onClick={() => history.push("/shift/add")}>
                  Add shift
                </Button>
                <Button variant="contained" onClick={onPublishClick} disabled={!!isShiftPublished} className={classes.publishButton}>
                  Publish
                </Button>
              </div>
            </Grid>
            <DataTable
              columns={isShiftPublished ? columns : columnsWithActions}
              data={rows}
              pagination
              progressPending={isLoading}
              paginationServer
              paginationTotalRows={totalCount}
              onChangeRowsPerPage={handlePerRowsChange}
              onChangePage={handlePageChange}
            />
          </CardContent>
        </Card>
      </Grid>
      <ConfirmDialog
        title="Publish Confirmation"
        description={`Do you want to publish this data ?`}
        onClose={onClosePublishDialog}
        open={showPublishConfirm}
        onYes={publishShiftByWeekId}
        loading={publishLoading} />

      <ConfirmDialog
        title="Delete Confirmation"
        description={`Do you want to delete this data ?`}
        onClose={onCloseDeleteDialog}
        open={showDeleteConfirm}
        onYes={deleteDataById}
        loading={deleteLoading}
      />
    </Grid>
  );
};

export default Shift;
