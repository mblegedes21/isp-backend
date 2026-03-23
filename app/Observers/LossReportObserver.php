<?php

namespace App\Observers;

use App\Events\LossApproved;
use App\Models\LossReport;

class LossReportObserver
{
    public function updated(LossReport $lossReport): void
    {
        if ($lossReport->wasChanged('status') && $lossReport->status === 'DISETUJUI') {
            LossApproved::dispatch($lossReport);
        }
    }
}
